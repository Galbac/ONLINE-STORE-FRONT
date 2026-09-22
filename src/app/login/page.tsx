import { GuestGuard } from "@/shared/ui";
import { LoginPage } from "@/widgets/login";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <GuestGuard>
      <LoginPage />
    </GuestGuard>
  );
}
