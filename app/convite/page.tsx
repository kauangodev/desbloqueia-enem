import InviteForm from "../../components/invite-form";
export default async function InvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <InviteForm token={token} />;
}
