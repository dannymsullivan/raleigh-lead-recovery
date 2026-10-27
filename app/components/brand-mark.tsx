import Link from "next/link";

export function BrandMark({ inverted = false, accent = "#63e6d1" }: { inverted?: boolean; accent?: string }) {
  const textColor = inverted ? "#ffffff" : "#111b35";

  return (
    <Link className="group inline-flex items-center gap-3" href="/" aria-label="Snappy Leads home">
      <span className="grid h-12 w-12 place-items-center transition-transform duration-200 group-hover:-translate-y-0.5">
        <svg aria-hidden="true" className="h-12 w-12" viewBox="0 0 56 56">
          <path d="M8 8h36v30H29l-9 7v-7H8z" fill="#fff9e7" stroke={inverted ? "#ffffff" : "#17232d"} strokeWidth="3" />
          <path d="M13 13h26v20H13z" fill="#f7fa00" stroke="#17232d" strokeWidth="2" />
          <path d="M19 20v3m13-3v3" stroke="#17232d" strokeWidth="3" strokeLinecap="round" />
          <path d="M20 27q6 6 12 0" fill="none" stroke="#17232d" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 47h36v5H9z" fill={inverted ? accent : "#17232d"} />
          <path d="M47 11h6m-3-3v6" stroke="#ff4f9a" strokeWidth="2.5" />
        </svg>
      </span>
      <span className="text-sm font-black leading-[1.02] tracking-[-0.035em]" style={{ color: textColor }}>
        Snappy
        <br />
        <span style={{ color: inverted ? accent : "#17232d" }}>Leads</span>
      </span>
    </Link>
  );
}
