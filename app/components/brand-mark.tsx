import Link from "next/link";

export function BrandMark({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link className="group inline-flex items-center gap-3" href="/" aria-label="Raleigh Lead Recovery home">
      <span className="grid h-10 w-10 place-items-center transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105">
        <svg aria-hidden="true" className="h-10 w-10" viewBox="0 0 48 48">
          <rect
            x="1.5"
            y="1.5"
            width="45"
            height="45"
            rx="12"
            fill={inverted ? "#ffffff" : "#11130f"}
            stroke={inverted ? "#ffffff" : "#11130f"}
            strokeWidth="3"
          />
          <path
            d="M14 34V13.5h10.2c6.4 0 10.1 3.1 10.1 8.2 0 4.1-2.6 6.8-7 7.7L34 35"
            fill="none"
            stroke={inverted ? "#11130f" : "#ffffff"}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <path
            d="M14 26.8h10.2"
            fill="none"
            stroke={inverted ? "#11130f" : "#ffffff"}
            strokeLinecap="round"
            strokeWidth="4"
          />
          <path
            d="M9.5 33.5c2.4 5.2 7.1 7.8 13.7 7.8h11.3m-4.2-4.2 4.2 4.2-4.2 4.2"
            fill="none"
            stroke="#d8ff57"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <circle cx="9.5" cy="33.5" r="2.8" fill="#d8ff57" />
        </svg>
      </span>
      <span className="text-sm font-black leading-[1.02] tracking-[-0.035em]">
        Raleigh Lead
        <br />
        <span className={inverted ? "text-[#d8ff57]" : "text-black"}>Recovery</span>
      </span>
    </Link>
  );
}
