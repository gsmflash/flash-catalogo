import { redirect } from "next/navigation";

export default function PagamentosIndexPage() {
  redirect("/admin/pagamentos/pedidos");
}
