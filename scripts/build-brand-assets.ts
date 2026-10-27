import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const outputDirectory = "public/brand";
const orbPath = `${outputDirectory}/voice-orb.png`;
const qrPath = "public/qr-demo-handout.svg";

function mark(x: number, y: number, size: number) {
  const scale = size / 48;
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <rect x="2" y="2" width="44" height="44" rx="13" fill="#12203f"/>
    <path d="M14.5 34.5V13.5h10.2c5.9 0 9.4 3 9.4 7.7s-3.5 7.6-9.4 7.6H14.5m10.3 0 9.8 7" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"/>
    <circle cx="35.5" cy="13" r="4.5" fill="#63e6d1"/>
    <path d="M39 34.5v6l5-3.2" fill="none" stroke="#63e6d1" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"/>
  </g>`;
}

function circularMark(x: number, y: number, size: number) {
  const scale = size / 48;
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <circle cx="24" cy="24" r="22" fill="#12203f"/>
    <path d="M14.5 34.5V13.5h10.2c5.9 0 9.4 3 9.4 7.7s-3.5 7.6-9.4 7.6H14.5m10.3 0 9.8 7" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"/>
    <circle cx="35.5" cy="13" r="4.5" fill="#63e6d1"/>
    <path d="M39 34.5v6l5-3.2" fill="none" stroke="#63e6d1" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"/>
  </g>`;
}

function wordmark(x: number, y: number, size = 48, inverted = false) {
  const primary = inverted ? "#fff" : "#111b35";
  const accent = inverted ? "#63e6d1" : "#2968e8";
  return `<text x="${x}" y="${y}" fill="${primary}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="800" letter-spacing="-1.8">
    <tspan x="${x}">Snappy</tspan><tspan x="${x}" dy="${size * 0.94}" fill="${accent}">Leads</tspan>
  </text>`;
}

function dataUri(content: Buffer, mime: string) {
  return `data:${mime};base64,${content.toString("base64")}`;
}

function gridPattern() {
  return `<defs>
    <pattern id="grid" width="52" height="52" patternUnits="userSpaceOnUse">
      <path d="M52 0H0V52" fill="none" stroke="#7596c6" stroke-opacity=".12" stroke-width="1"/>
    </pattern>
    <linearGradient id="canvas" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f8fbff"/><stop offset=".55" stop-color="#eaf2ff"/><stop offset="1" stop-color="#dff7f4"/>
    </linearGradient>
  </defs>`;
}

async function render(svg: string, baseName: string, width: number, height: number) {
  await sharp(Buffer.from(svg)).png().withMetadata({ density: 300 }).toFile(`${outputDirectory}/${baseName}.png`);
  await sharp(Buffer.from(svg)).jpeg({ quality: 95, chromaSubsampling: "4:4:4" }).withMetadata({ density: 300 }).toFile(`${outputDirectory}/${baseName}.jpg`);
  const metadata = await sharp(`${outputDirectory}/${baseName}.png`).metadata();
  if (metadata.width !== width || metadata.height !== height) throw new Error(`${baseName} rendered at the wrong size.`);
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });
  const [orb, qr] = await Promise.all([readFile(orbPath), readFile(qrPath)]);
  const orbUri = dataUri(orb, "image/png");
  const qrUri = dataUri(qr, "image/svg+xml");

  const logoMark = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${mark(0, 0, 512)}</svg>`;
  await writeFile(`${outputDirectory}/raleigh-lead-recovery-mark.svg`, logoMark);
  await sharp(Buffer.from(logoMark)).png().resize(1024, 1024).toFile(`${outputDirectory}/raleigh-lead-recovery-mark.png`);

  const profileMark = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="#eef5ff"/>${circularMark(32, 32, 960)}</svg>`;
  await writeFile(`${outputDirectory}/raleigh-lead-recovery-profile.svg`, profileMark);
  await sharp(Buffer.from(profileMark)).png().withMetadata({ density: 300 }).toFile(`${outputDirectory}/raleigh-lead-recovery-profile.png`);

  const horizontalLogo = `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="512" viewBox="0 0 1800 512">
    <rect width="1800" height="512" fill="transparent"/>${mark(36, 36, 440)}${wordmark(546, 190, 112)}
  </svg>`;
  await writeFile(`${outputDirectory}/raleigh-lead-recovery-logo.svg`, horizontalLogo);
  await sharp(Buffer.from(horizontalLogo)).png().toFile(`${outputDirectory}/raleigh-lead-recovery-logo.png`);

  const cover = `<svg xmlns="http://www.w3.org/2000/svg" width="1640" height="624" viewBox="0 0 1640 624">
    ${gridPattern()}<rect width="1640" height="624" fill="url(#canvas)"/><rect width="1640" height="624" fill="url(#grid)"/>
    <circle cx="145" cy="530" r="280" fill="#63e6d1" opacity=".11"/><circle cx="1510" cy="120" r="310" fill="#2968e8" opacity=".09"/>
    <image href="${orbUri}" x="1160" y="90" width="500" height="500" opacity=".9"/>
    <image href="${orbUri}" x="-110" y="390" width="300" height="300" opacity=".3"/>
    ${mark(120, 48, 74)}${wordmark(213, 79, 27)}
    <text x="120" y="245" fill="#111b35" font-family="Georgia, 'Times New Roman', serif" font-size="66" font-weight="700" letter-spacing="-2.7">
      <tspan x="120">Every missed call gets</tspan><tspan x="120" dy="74">a real next step.</tspan>
    </text>
    <text x="120" y="430" fill="#425675" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="600">AI call coverage for Triangle service businesses.</text>
    <rect x="120" y="480" width="544" height="66" rx="33" fill="#12203f"/>
    <text x="392" y="522" text-anchor="middle" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" letter-spacing=".4">RALEIGHLEADRECOVERY.COM</text>
  </svg>`;
  await render(cover, "facebook-cover", 1640, 624);

  const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1800" viewBox="0 0 1200 1800">
    ${gridPattern()}<rect width="1200" height="1800" fill="url(#canvas)"/><rect width="1200" height="1800" fill="url(#grid)"/>
    <circle cx="1020" cy="220" r="310" fill="#2968e8" opacity=".08"/><circle cx="140" cy="1560" r="360" fill="#63e6d1" opacity=".12"/>
    ${mark(88, 88, 108)}${wordmark(224, 126, 42)}
    <rect x="88" y="270" width="430" height="46" rx="23" fill="#d8ff57"/>
    <text x="303" y="301" text-anchor="middle" fill="#12203f" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800" letter-spacing="1.5">TRY THE LIVE BROWSER DEMO</text>
    <text x="88" y="430" fill="#111b35" font-family="Georgia, 'Times New Roman', serif" font-size="88" font-weight="700" letter-spacing="-3.7">
      <tspan x="88">What happens when</tspan><tspan x="88" dy="96">your team misses a</tspan><tspan x="88" dy="96">new-customer call?</tspan>
    </text>
    <text x="92" y="765" fill="#425675" font-family="Arial, Helvetica, sans-serif" font-size="31" font-weight="600">
      <tspan x="92">Chloe answers, has a natural conversation,</tspan><tspan x="92" dy="48">captures what the caller needs, and gives</tspan><tspan x="92" dy="48">your team a clear next step.</tspan>
    </text>
    <image href="${orbUri}" x="780" y="900" width="360" height="360"/>
    <g transform="translate(92 940)">
      <circle cx="24" cy="24" r="24" fill="#d8ff57"/><path d="m13 24 7 7 16-18" fill="none" stroke="#12203f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="70" y="34" fill="#111b35" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="800">Answers missed &amp; after-hours calls</text>
      <circle cx="24" cy="112" r="24" fill="#d8ff57"/><path d="m13 112 7 7 16-18" fill="none" stroke="#12203f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="70" y="122" fill="#111b35" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="800">Keeps the conversation short &amp; natural</text>
      <circle cx="24" cy="200" r="24" fill="#d8ff57"/><path d="m13 200 7 7 16-18" fill="none" stroke="#12203f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="70" y="210" fill="#111b35" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="800">Sends the need, urgency &amp; next step</text>
    </g>
    <rect x="68" y="1370" width="1064" height="350" rx="38" fill="#12203f"/>
    <text x="118" y="1445" fill="#63e6d1" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800" letter-spacing="2">HEAR IT YOURSELF</text>
    <text x="118" y="1522" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="800">Try the browser demo</text>
    <text x="118" y="1582" fill="#c8d8f5" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="600">Visit snappyleads.xyz</text>
    <text x="118" y="1650" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700">Hands-on setup for your business.</text>
    <rect x="855" y="1418" width="220" height="220" rx="22" fill="#fff"/><image href="${qrUri}" x="875" y="1438" width="180" height="180"/>
    <text x="965" y="1670" text-anchor="middle" fill="#63e6d1" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="800">SCAN FOR LIVE DEMO</text>
  </svg>`;
  await render(card, "leave-behind-4x6", 1200, 1800);

  console.log("Built Snappy Leads logo, Facebook cover, and 4x6 leave-behind assets.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
