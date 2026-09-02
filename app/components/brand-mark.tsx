import Link from "next/link";

export function BrandMark({ inverted = false, accent = "#63e6d1" }: { inverted?: boolean; accent?: string }) {
  const textColor = inverted ? "#ffffff" : "#111b35";

  return (
    <Link className="group inline-flex items-center gap-3" href="/" aria-label="Raleigh Lead Recovery home">
      <span className="grid h-10 w-10 place-items-center transition-transform duration-200 group-hover:-translate-y-0.5">
        <svg aria-hidden="true" className="h-10 w-10" viewBox="0 0 48 48">
          <rect
            x="2"
            y="2"
            width="44"
            height="44"
            rx="13"
            fill="#12203f"
          />
          <path
            d="M14.5 34.5V13.5h10.2c5.9 0 9.4 3 9.4 7.7s-3.5 7.6-9.4 7.6H14.5m10.3 0 9.8 7"
            fill="none"
            stroke="#ffffff"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <circle cx="35.5" cy="13" r="4.5" fill={accent} />
          <path d="M39 34.5v6l5-3.2" fill="none" stroke={accent} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
        </svg>
      </span>
      <span className="text-sm font-black leading-[1.02] tracking-[-0.035em]" style={{ color: textColor }}>
        Raleigh Lead
        <br />
        <span style={{ color: inverted ? accent : "#2968e8" }}>Recovery</span>
      </span>
    </Link>
  );
}
