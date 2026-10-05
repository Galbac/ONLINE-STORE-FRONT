import { Suspense } from "react";
import { headers } from "next/headers";
import { isMobileUserAgent } from "@/shared/lib/device/isMobileUserAgent";
import { LoginPage } from "@/widgets/login";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const [requestHeaders, params] = await Promise.all([headers(), searchParams]);
  const isMobile = isMobileUserAgent(requestHeaders.get("user-agent") ?? "");

  return (
    <Suspense fallback={null}>
      <LoginPage isMobile={isMobile} showLoginForm={params.mode === "form"} />
    </Suspense>
  );
}
