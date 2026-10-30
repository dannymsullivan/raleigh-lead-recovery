import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Raleigh crawl space businesses: three months of website chat, on us. Apply for the Snappy Leads pilot. Selection required.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const font = await readFile(join(process.cwd(), "public/fonts/league-gothic-social.ttf"));
  return new ImageResponse(<div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: 48, border: "10px solid #17232d", background: "#2155ff", color: "#fff9e7" }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24 }}><span>SNAPPY LEADS</span><span>RALEIGH + THE TRIANGLE</span></div>
    <div style={{ display: "flex", flexDirection: "column", fontFamily: "Pilot Display", fontSize: 102, lineHeight: 1 }}><span>CRAWL SPACE CHAT.</span><span style={{ color: "#f7fa00" }}>THREE MONTHS ON US.</span></div>
    <div style={{ display: "flex", fontSize: 26 }}>Setup included · 1,000 AI replies/month · Five pilot businesses</div>
    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 22, borderTop: "2px solid #fff9e7", fontSize: 20 }}><span>Apply at snappyleads.xyz/crawl-space-pilot</span><span>Selection required. No card needed.</span></div>
  </div>, { ...size, fonts: [{ name: "Pilot Display", data: font, style: "normal", weight: 400 }] });
}
