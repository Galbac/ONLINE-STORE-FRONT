import { redirect } from "next/navigation";
import { ROUTES } from "@/shared/config";

export const dynamic = "force-dynamic";

export default function Page() {
  redirect(ROUTES.ADMIN_DASHBOARD);
}
