import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SnappySocialImage } from "@/lib/snappy-social-image";

export const alt = "Snappy Leads. Knows your business. Works 24/7. Deep business knowledge, 24/7 answers, chat and voice.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [image, displayFont, textFont] = await Promise.all([
    readFile(join(process.cwd(), "public/illustrations/front-desk-mascot.png")),
    readFile(join(process.cwd(), "public/fonts/league-gothic-social.ttf")),
    readFile(join(process.cwd(), "public/fonts/instrument-sans-social.ttf")),
  ]);
  const mascot = `data:image/png;base64,${image.toString("base64")}`;
  return new ImageResponse(<SnappySocialImage mascot={mascot} />, {
    ...size,
    fonts: [
      { name: "Snappy Display", data: displayFont, weight: 400, style: "normal" },
      { name: "Snappy Sans", data: textFont, weight: 700, style: "normal" },
    ],
  });
}
