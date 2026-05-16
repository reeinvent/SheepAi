import { IssueDashboard } from "@/app/components/issues/IssueDashboard";
import { MOCK_TICKETS } from "@/app/lib/issues/mock";

export default function Home() {
  return <IssueDashboard initialTickets={MOCK_TICKETS} />;
}
