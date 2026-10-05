-- ============================================================================
-- PiBarber — 37_aceite_dos_termos.sql
--
-- O REGISTRO DO ACEITE DOS TERMOS DE USO E DA POLÍTICA DE PRIVACIDADE.
--
-- Até aqui a caixa "Li e aceito" só existia na tela: o servidor não sabia se
-- ela tinha sido marcada e nada ficava gravado. Numa disputa (cancelamento,
-- estorno, os 7 dias de arrependimento dos Termos, item 5) não havia como
-- mostrar que AQUELA conta aceitou AQUELA versão.
--
-- ---------------------------------------------------------------------------
-- AS DUAS PEÇAS
-- ---------------------------------------------------------------------------
--   terms_acceptances  → o histórico. Uma linha por aceite, só cresce: nada é
--                        editado nem apagado pela aplicação. Mudou a versão,
--                        o novo aceite é uma linha nova.
--   profiles.terms_version / privacy_version
--                      → a versão aceita MAIS RECENTE, copiada por trigger.
--                        Existe para o middleware decidir "precisa aceitar?"
--                        na mesma consulta que ele já faz ao perfil, sem ir
--                        ao banco de novo a cada página.
--
-- As versões são as datas de atualização dos textos (src/lib/termos.ts, que é
-- a fonte delas). O banco não as valida: guarda o que o servidor afirmou que
-- a pessoa viu.
--
-- ---------------------------------------------------------------------------
-- QUEM ESCREVE
-- ---------------------------------------------------------------------------
-- Só o servidor, com a service role (src/lib/aceite-termos.ts), e só para a
-- conta que acabou de nascer ou que acabou de provar quem é. `authenticated`
-- não tem insert/update/delete na tabela, e as duas colunas novas do perfil
-- ficam FORA do grant por coluna do 03_rls.sql — um PATCH no próprio perfil
-- não marca "aceitei" sem a linha do histórico.
--
-- ---------------------------------------------------------------------------
-- O QUE NÃO ESTÁ AQUI, DE PROPÓSITO
-- ---------------------------------------------------------------------------
--   - IP e navegador: reforçariam a prova, mas a política de privacidade não
--     diz que guardamos isso. Entram junto com o texto da política, se o
--     jurídico quiser.
--   - Sobreviver à exclusão da conta: a política promete que excluir a conta
--     remove o perfil, então o histórico sai junto (on delete cascade).
--
-- Rollback:
--   drop trigger if exists terms_acceptances_after_insert on terms_acceptances;
--   drop function if exists terms_acceptance_after_insert();
--   drop table if exists terms_acceptances;
--   alter table profiles drop column if exists terms_version,
--                        drop column if exists privacy_version;
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. O histórico
-- ---------------------------------------------------------------------------
create table if not exists terms_acceptances (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles (id) on delete cascade,
  terms_version   text not null,
  privacy_version text not null,
  -- Por onde a pessoa aceitou. O rótulo fica em src/lib/termos.ts.
  source          text not null,
  accepted_at     timestamptz not null default now()
);

do $$ begin
  alter table terms_acceptances add constraint terms_acceptances_source_valida
    check (source in (
      'cadastro_cliente', 'cadastro_barbearia', 'vinculo_barbearia', 'tela_de_aceite'
    ));
exception when duplicate_object then null;
end $$;

create index if not exists terms_acceptances_user_idx
  on terms_acceptances (user_id, accepted_at desc);


-- ---------------------------------------------------------------------------
-- 2. A versão vigente no perfil
-- ---------------------------------------------------------------------------
alter table profiles add column if not exists terms_version text;
alter table profiles add column if not exists privacy_version text;

create or replace function terms_acceptance_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  update profiles
     set terms_version   = new.terms_version,
         privacy_version = new.privacy_version
   where id = new.user_id;
  return new;
end;
$fn$;

revoke all on function terms_acceptance_after_insert() from public, anon, authenticated;

drop trigger if exists terms_acceptances_after_insert on terms_acceptances;
create trigger terms_acceptances_after_insert
  after insert on terms_acceptances
  for each row execute function terms_acceptance_after_insert();


-- ---------------------------------------------------------------------------
-- 3. RLS: cada um lê o próprio histórico; o admin lê todos; ninguém escreve
-- ---------------------------------------------------------------------------
alter table terms_acceptances enable row level security;

drop policy if exists terms_acceptances_select on terms_acceptances;
create policy terms_acceptances_select on terms_acceptances
  for select to authenticated
  using (user_id = auth.uid() or is_platform_admin());

revoke all on terms_acceptances from public, anon, authenticated;
grant select on terms_acceptances to authenticated;


-- ---------------------------------------------------------------------------
-- 4. Portão: as colunas novas do perfil não podem ser graváveis pela API
-- ---------------------------------------------------------------------------
do $$ begin
  if has_column_privilege('authenticated', 'public.profiles', 'terms_version', 'UPDATE')
     or has_column_privilege('authenticated', 'public.profiles', 'privacy_version', 'UPDATE') then
    raise exception 'profiles.terms_version/privacy_version ficaram graváveis por authenticated';
  end if;
end $$;

commit;
