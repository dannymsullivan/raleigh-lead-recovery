import { ImageResponse } from "next/og";
import { SocialImage } from "@/lib/social-image";

export const alt = "Raleigh Lead Recovery — every missed call gets a real next step";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SocialImage
      eyebrow="Natural missed-call coverage"
      title="Every missed call gets a real next step."
      footer="Free pilot · 7 days or 5 handled calls"
    />,
    size,
  );
}
