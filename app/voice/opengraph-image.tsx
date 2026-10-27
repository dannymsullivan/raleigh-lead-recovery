import { ImageResponse } from "next/og";
import { SocialImage } from "@/lib/social-image";

export const alt = "Snappy Leads — missed-call voice coverage";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<SocialImage eyebrow="Natural missed-call coverage" title="Answer calls when your team is busy." footer="Call summaries · Your number · Hands-on setup" />, size);
}
