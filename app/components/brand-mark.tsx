import Link from "next/link";

export function BrandMark({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link className="group inline-flex items-center gap-3" href="/" aria-label="Raleigh Lead Recovery home">
      <span
        className={`relative grid h-10 w-10 place-items-center rounded-full border-2 text-sm font-black transition-transform group-hover:-rotate-6 ${
          inverted ? "border-white bg-white text-black" : "border-black bg-black text-white"
        }`}
      >
        R
        <span className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 ${inverted ? "border-black bg-white" : "border-white bg-black"}`} />
      </span>
      <span className="text-sm font-extrabold leading-[1.05] tracking-[-0.02em]">
        Raleigh Lead
        <br />
        Recovery
      </span>
    </Link>
  );
}
