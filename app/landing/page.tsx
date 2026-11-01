import LandingPage from "../../components/landing/LandingPage";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Desbloqueia ENEM 2026 | GoDev Education",
  alternates: { canonical: "/landing" },
};

export default function LandingRoute() {
  return <LandingPage />;
}

