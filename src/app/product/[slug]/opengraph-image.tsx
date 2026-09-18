import { ImageResponse } from "next/og";
import { STORE_INFO } from "@/shared/config";

export const runtime = "edge";
export const alt = "Превью товара";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug).replace(/-/g, " ");

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #0f172a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          fontFamily: "system-ui, sans-serif",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              background: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            ✨
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{STORE_INFO.name}</div>
          <div
            style={{
              marginLeft: 16,
              fontSize: 16,
              background: "rgba(255,255,255,0.15)",
              padding: "6px 16px",
              borderRadius: 999,
              fontWeight: 600,
              color: "#6ee7b7",
            }}
          >
            Доставка за 45 минут
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 54,
              fontWeight: 900,
              lineHeight: 1.15,
              maxHeight: 180,
              overflow: "hidden",
              textTransform: "capitalize",
            }}
          >
            {decodedSlug}
          </div>
          <div style={{ fontSize: 24, color: "#94a3b8" }}>
            100% натуральные и фермерские продукты с гарантией свежести
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            paddingTop: 32,
          }}
        >
          <div style={{ fontSize: 20, color: "#cbd5e1" }}>
            Заказывайте онлайн свежие продукты
          </div>
          <div
            style={{
              background: "#059669",
              color: "white",
              padding: "12px 28px",
              borderRadius: 16,
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            В каталог ➔
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
