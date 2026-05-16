import { CommunityFeed } from "@/app/components/public/CommunityFeed";
import { MOCK_TICKETS } from "@/app/lib/issues/mock";

export const metadata = {
  title: "Community board — Peristil",
};

export default function CommunityPage() {
  return <CommunityFeed initialTickets={MOCK_TICKETS} />;
}
