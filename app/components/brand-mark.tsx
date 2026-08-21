import Link from "next/link";

export function BrandMark({ inverted = false, accent = "#d8ff57" }: { inverted?: boolean; accent?: string }) {
  return (
    <Link className="group inline-flex items-center gap-3" href="/" aria-label="Raleigh Lead Recovery home">
      <span className="grid h-10 w-10 place-items-center transition-transform duration-200 group-hover:-translate-y-0.5">
        <svg aria-hidden="true" className="h-10 w-10" viewBox="0 0 48 48">
          <rect
            x="2"
            y="2"
            width="44"
            height="44"
            rx="10"
            fill={accent}
            stroke={inverted ? accent : "#11130f"}
            strokeWidth="2"
          />
          <path
            d="M15 36V12.5h10c6.2 0 10 3.1 10 8.3 0 5.1-3.8 8.2-10 8.2H15m10 0 10 7"
            fill="none"
            stroke="#11130f"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4.5"
          />
        </svg>
      </span>
      <span className="text-sm font-black leading-[1.02] tracking-[-0.035em]">
        Raleigh Lead
        <br />
        <span className={inverted ? undefined : "text-black"} style={inverted ? { color: accent } : undefined}>Recovery</span>
      </span>
    </Link>
  );
}
