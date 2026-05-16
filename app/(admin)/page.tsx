import { IssueDashboard } from "@/app/components/issues/IssueDashboard";
import { getAllTickets } from "@/app/lib/actions/ticketActions";
import { dbTicketToTicketObject } from "@/app/lib/issues/mappers";

export default async function AdminHome() {
  const dbTickets = await getAllTickets();
  const tickets = dbTickets.map(dbTicketToTicketObject);
  return <IssueDashboard initialTickets={tickets} />;
}
