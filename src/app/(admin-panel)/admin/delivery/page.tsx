import { redirect } from "next/navigation";
import { ROUTES } from "@/shared/config";

export default function Page() {
  redirect(ROUTES.ADMIN_DELIVERY_SETTINGS);
}
