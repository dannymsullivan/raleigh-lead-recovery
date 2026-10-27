import { ImageResponse } from "next/og";

export const alt = "1995 called. It wants its contact form back. Snappy Leads.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#2155ff", color: "#fff9e7", padding: 55, border: "12px solid #17232d" }}>
      <div style={{ display: "flex", fontFamily: "sans-serif", fontSize: 22, fontWeight: 700 }}>SNAPPY LEADS</div>
      <div style={{ display: "flex", flexDirection: "column", fontFamily: "sans-serif", fontWeight: 900, fontSize: 76, letterSpacing: -3, lineHeight: 1.05, marginTop: 35 }}>
        <span>1995 CALLED.</span>
        <span>IT WANTS ITS</span>
        <span style={{ color: "#f7fa00" }}>CONTACT FORM BACK.</span>
      </div>
      <div style={{ display: "flex", fontFamily: "sans-serif", fontSize: 23, marginTop: "auto", background: "#f7fa00", color: "#17232d", padding: "12px 20px", alignSelf: "flex-start", borderBottom: "6px solid #ff4f9a" }}>Website chat. Better leads. Two weeks free.</div>
    </div>,
    size,
  );
}
