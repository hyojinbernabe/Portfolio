import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_NAME } from "@/lib/site-config";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(
    join(process.cwd(), "public", "hyojin-bernabe-logo.png"),
    "base64",
  );
  const logoSrc = `data:image/png;base64,${logoData}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#16a34a",
        }}
      >
        <img src={logoSrc} width={200} height={200} alt="" />
        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 64,
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          Hyojin Bernabe
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 12,
            fontSize: 28,
            color: "#ffffff",
          }}
        >
          Full stack developer: web and mobile apps
        </div>
      </div>
    ),
    { ...size },
  );
}
