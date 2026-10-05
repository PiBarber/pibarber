import { CascaSimples } from "@/components/auth/CascaSimples";

/**
 * Casca das telas de passagem da autenticação. Fica FORA de /app e /painel de
 * propósito: uma tela de escape dentro do grupo de rotas protegido entraria em
 * loop de redirect.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <CascaSimples>{children}</CascaSimples>;
}
