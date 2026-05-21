import { ResetPasswordPage } from "@/widgets/reset-password";

interface PageProps {
  searchParams: Promise<{
    token?: string | string[];
  }>;
}

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? (params.token[0] ?? "") : (params.token ?? "");

  return <ResetPasswordPage token={token} />;
}
