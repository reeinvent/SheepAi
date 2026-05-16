import { CommunityFeed } from "@/app/components/public/CommunityFeed";
import { getAllTickets } from "@/app/lib/actions/ticketActions";
import { dbTicketToTicketObject } from "@/app/lib/issues/mappers";

export const metadata = {
  title: "Oglasna ploča zajednice — Peristil",
};

export default async function CommunityPage() {
  const dbTickets = await getAllTickets();
  const tickets = dbTickets.map(dbTicketToTicketObject);
  return <CommunityFeed initialTickets={tickets} />;
}
