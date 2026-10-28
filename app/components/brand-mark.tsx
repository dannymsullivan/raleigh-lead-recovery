import Image from "next/image";
import Link from "next/link";

export function BrandMark({ inverted = false, accent = "#63e6d1" }: { inverted?: boolean; accent?: string }) {
  const textColor = inverted ? "#ffffff" : "#111b35";

  return (
    <Link className="group inline-flex items-center gap-3" href="/" aria-label="Snappy Leads home">
      <Image
        src="/illustrations/front-desk-mascot.png"
        alt=""
        width={68}
        height={62}
        sizes="68px"
        className="h-[62px] w-[68px] shrink-0 object-contain"
      />
      <span className="text-sm font-black leading-[1.02] tracking-[-0.035em]" style={{ color: textColor }}>
        Snappy
        <br />
        <span style={{ color: inverted ? accent : "#17232d" }}>Leads</span>
      </span>
    </Link>
  );
}
