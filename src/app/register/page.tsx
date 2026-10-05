import { headers } from "next/headers";
import { isMobileUserAgent } from "@/shared/lib/device/isMobileUserAgent";
import { RegisterPage } from "@/widgets/register";

export const dynamic = "force-dynamic";

export default async function Page() {
  const requestHeaders = await headers();
  const isMobile = isMobileUserAgent(requestHeaders.get("user-agent") ?? "");

  return <RegisterPage isMobile={isMobile} />;
}
