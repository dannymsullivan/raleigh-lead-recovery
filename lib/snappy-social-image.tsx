/* Plain image elements are required by Next's social-image renderer. */
/* eslint-disable @next/next/no-img-element */

export function SnappySocialImage({ mascot }: { mascot: string }) {
  return <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", overflow: "hidden", border: "10px solid #17232d", background: "#fff9e7", color: "#17232d", fontFamily: "Snappy Sans", fontWeight: 700 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 105, padding: "14px 39px", borderBottom: "3px solid #17232d" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
        <img src={mascot} width={76} height={70} alt="" style={{ objectFit: "contain" }} />
        <div style={{ display: "flex", flexDirection: "column", fontSize: 30, fontWeight: 900, lineHeight: .96, letterSpacing: -1 }}><span>SNAPPY</span><span>LEADS</span></div>
      </div>
      <div style={{ display: "flex", fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>YOUR AI SERVICE ADVISOR</div>
    </div>

    <div style={{ display: "flex", position: "relative", flex: 1, background: "#2155ff", color: "#fff9e7", padding: "35px 46px" }}>
      <div style={{ display: "flex", flexDirection: "column", width: 710, position: "relative" }}>
        <div style={{ display: "flex", alignSelf: "flex-start", padding: "7px 12px", background: "#fff9e7", border: "2px solid #17232d", color: "#17232d", fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>OLD-SCHOOL SERVICE. NEW-SCHOOL TECH.</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 17, fontFamily: "Snappy Display", fontSize: 94, fontWeight: 400, lineHeight: .88, letterSpacing: -1 }}>
          <span>KNOWS YOUR</span>
          <span>BUSINESS.</span>
          <span style={{ color: "#f7fa00", marginTop: 6 }}>WORKS 24/7.</span>
        </div>
        <div style={{ display: "flex", marginTop: 17, maxWidth: 650, fontSize: 20, lineHeight: 1.35 }}>Real answers. Your knowledge. Around the clock.</div>
      </div>

      <div style={{ display: "flex", position: "absolute", right: 28, top: 19, width: 390, height: 390, alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", position: "absolute", top: 54, left: 23, width: 320, height: 320, borderRadius: "50%", background: "#a9edff", border: "3px solid #17232d", boxShadow: "8px 8px 0 #17232d" }} />
        <img src={mascot} width={368} height={345} alt="Snappy Leads computer mascot" style={{ position: "absolute", top: 42, left: 5, objectFit: "contain", transform: "rotate(4deg)" }} />
        <div style={{ display: "flex", position: "absolute", right: 1, top: 4, alignItems: "center", justifyContent: "center", width: 132, height: 62, background: "#ff4f9a", border: "3px solid #17232d", transform: "rotate(8deg)", boxShadow: "4px 4px 0 #17232d", color: "#17232d", fontFamily: "Snappy Display", fontSize: 32, fontWeight: 400 }}>ALWAYS ON</div>
      </div>
    </div>

    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 77, padding: "0 45px", borderTop: "3px solid #17232d", background: "#f7fa00", fontSize: 18, fontWeight: 700 }}>
      <div style={{ display: "flex", gap: 32 }}><span>DEEP BUSINESS KNOWLEDGE</span><span>24/7 ANSWERS</span><span>CHAT + VOICE</span></div>
      <span style={{ fontSize: 15 }}>snappyleads.xyz</span>
    </div>
  </div>;
}
