import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Materiais | Administração | GoDev Education",
  robots: { index: false, follow: false },
};

export default function AdminMaterialsPage() {
  redirect("/admin?tab=materiais");
}
