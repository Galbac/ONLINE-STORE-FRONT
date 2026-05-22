import { notFound } from "next/navigation";
import { ProfileOrderDetailsPage } from "@/widgets/profile-orders";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { orderId } = await params;
  const numericOrderId = Number(orderId);

  if (!Number.isInteger(numericOrderId) || numericOrderId <= 0) {
    notFound();
  }

  return <ProfileOrderDetailsPage orderId={numericOrderId} />;
}
