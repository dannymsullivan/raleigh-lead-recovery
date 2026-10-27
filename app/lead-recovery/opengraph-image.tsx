import { ImageResponse } from "next/og";
import { SocialImage } from "@/lib/social-image";

export const alt = "Snappy Leads — turn old leads into real conversations";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SocialImage
      eyebrow="Thoughtful lead reactivation"
      title="Turn old leads into real conversations."
      footer="Live voice demo · Start with 25 contacts"
    />,
    size,
  );
}
