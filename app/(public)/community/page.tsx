import { CommunityFeed } from "@/app/components/public/CommunityFeed";
import { MOCK_TICKETS } from "@/app/lib/issues/mock";

export const metadata = {
  title: "Oglasna ploča zajednice — Peristil",
};

export default function CommunityPage() {
  return <CommunityFeed initialTickets={MOCK_TICKETS} />;
}
