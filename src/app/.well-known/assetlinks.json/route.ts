import { NextResponse } from "next/server";

export async function GET() {
  const assetlinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "ru.grocerystore.app",
        sha256_cert_fingerprints: [
          "14:6D:E9:7D:0F:52:AB:E6:85:49:12:35:6E:9B:4E:22:9E:8D:15:33:04:14:65:09:A6:CF:21:40:F1:C2:59:75",
        ],
      },
    },
  ];

  return NextResponse.json(assetlinks, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
