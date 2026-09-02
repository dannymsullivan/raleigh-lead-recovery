type SocialImageProps = {
  eyebrow: string;
  title: string;
  footer: string;
};

export function SocialImage({ eyebrow, title, footer }: SocialImageProps) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "linear-gradient(135deg, #f7fbff 0%, #e8f1ff 52%, #dff7f4 100%)",
        color: "#111b35",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          opacity: 0.18,
          backgroundImage:
            "linear-gradient(#7596c6 1px, transparent 1px), linear-gradient(90deg, #7596c6 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />
      <div style={{ display: "flex", width: "64%", flexDirection: "column", padding: "62px 0 54px 68px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", display: "flex", width: 58, height: 58, alignItems: "center", justifyContent: "center", borderRadius: 17, background: "#12203f" }}>
            <span style={{ color: "#fff", fontSize: 36, fontWeight: 800, letterSpacing: -4 }}>R</span>
            <span style={{ position: "absolute", width: 10, height: 10, margin: "-31px 0 0 31px", borderRadius: 99, background: "#63e6d1" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 20, fontWeight: 800, lineHeight: 1.02 }}>
            <span>Raleigh Lead</span>
            <span style={{ color: "#2968e8" }}>Recovery</span>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 74, color: "#355173", fontSize: 17, fontWeight: 800, letterSpacing: 2.4, textTransform: "uppercase" }}>
          {eyebrow}
        </div>
        <div style={{ display: "flex", maxWidth: 720, marginTop: 18, fontSize: 66, fontWeight: 800, letterSpacing: -3.7, lineHeight: 1.02 }}>
          {title}
        </div>
        <div style={{ display: "flex", width: "auto", alignSelf: "flex-start", marginTop: "auto", borderRadius: 999, padding: "15px 22px", background: "#111b35", color: "#fff", fontSize: 17, fontWeight: 800 }}>
          {footer}
        </div>
      </div>
      <div style={{ position: "relative", display: "flex", width: "36%", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", display: "flex", width: 390, height: 390, border: "1px solid rgba(41, 104, 232, .14)", borderRadius: 999 }} />
        <div style={{ position: "absolute", display: "flex", width: 300, height: 300, border: "1px solid rgba(41, 104, 232, .18)", borderRadius: 999 }} />
        <div
          style={{
            position: "relative",
            display: "flex",
            width: 226,
            height: 226,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            background: "linear-gradient(145deg, #b7fff5 0%, #65ead3 24%, #3478ff 58%, #9c72ff 100%)",
            boxShadow: "0 0 55px rgba(79, 150, 225, .4), inset -18px -22px 35px rgba(22, 32, 93, .3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            {[18, 35, 54, 35, 18].map((height, index) => (
              <span key={index} style={{ display: "flex", width: 5, height, borderRadius: 99, background: "#fff", boxShadow: "0 0 8px rgba(255,255,255,.55)" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
