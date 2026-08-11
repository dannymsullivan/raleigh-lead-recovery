import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Check, ExternalLink, PhoneCall, Play, Quote } from "lucide-react";
import { BrandMark } from "./components/brand-mark";
import { contactEmail, contactHref } from "@/lib/contact";

const demoNumber = "+19842992155";
const demoNumberDisplay = "(984) 299-2155";

const steps = [
  { number: "01", title: "You miss a call.", body: "Your current number stays put. Busy, no-answer, and after-hours calls simply roll to Mabel." },
  { number: "02", title: "Mabel gets the details.", body: "She asks what happened, where they are, how urgent it is, and when they need help. One question at a time." },
  { number: "03", title: "You get the lead.", body: "A clean summary hits your phone and dashboard. Call back knowing exactly what the customer needs." }
];

const capturePoints = [
  "Caller name and callback number",
  "What broke, leaked, stopped, or sparked",
  "Service address and timing",
  "Emergency, urgent, or routine",
  "A short summary your team can scan",
  "The recording when you need context"
];

const faqs = [
  { q: "Do I need a new phone number?", a: "Nope. Customers keep calling the same number. You set conditional forwarding so Mabel only gets the calls your team does not answer." },
  { q: "Does Mabel pretend to be human?", a: "No weird games. Mabel is your automated call assistant, speaks naturally, and focuses on being genuinely useful to the caller." },
  { q: "Can she follow our rules?", a: "Yes. Service area, hours, emergencies, caller questions, callback promises, and wording are all set around your business." },
  { q: "Can I turn it off?", a: "Any time. You control forwarding from your existing phone provider. No number porting and no hostage situation." }
];

export default function LandingPage() {
  return (
    <main className="overflow-hidden bg-[#f4f1e8] text-black">
      <header className="border-b-2 border-black">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <BrandMark />
          <div className="flex items-center gap-3 sm:gap-6">
            <a className="hidden text-sm font-extrabold hover:underline hover:decoration-2 hover:underline-offset-4 md:block" href="#how-it-works">How it works</a>
            <Link className="hidden text-sm font-extrabold hover:underline hover:decoration-2 hover:underline-offset-4 sm:block" href="/login">Sign in</Link>
            <Link className="inline-flex h-11 items-center gap-2 bg-black px-4 text-sm font-extrabold text-white transition-transform hover:-translate-y-0.5 sm:px-5" href="/signup">
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative border-b-2 border-black">
        <div className="mx-auto grid min-h-[710px] max-w-6xl lg:grid-cols-[1.08fr_0.92fr]">
          <div className="flex flex-col justify-center px-5 py-20 sm:px-8 lg:border-r-2 lg:border-black lg:py-28 lg:pr-14">
            <p className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-black/50">
              <span className="h-2.5 w-2.5 rounded-full bg-black" /> Answers when you can’t
            </p>
            <h1 className="mt-8 max-w-3xl text-[clamp(4.4rem,10vw,7.5rem)] font-black leading-[0.82] tracking-[-0.075em]">
              Miss the call.<br />Not the job.
            </h1>
            <p className="mt-9 max-w-xl text-lg font-semibold leading-8 text-black/62 sm:text-xl">
              Mabel answers the customer calls your team can’t, gets the important bits, and puts the lead on your board. No new number. No phone-system nonsense.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a className="group inline-flex h-14 items-center justify-center gap-3 bg-black px-6 font-extrabold text-white transition-transform hover:-translate-y-1" href={`tel:${demoNumber}`}>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-black"><Play className="ml-0.5 h-3.5 w-3.5 fill-current" /></span>
                Call Mabel now
              </a>
              <Link className="inline-flex h-14 items-center justify-center gap-2 border-2 border-black bg-transparent px-6 font-extrabold hover:bg-white" href="/signup">
                Start 14 days free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-4 text-xs font-bold text-black/42">One call. About 60 seconds. Try: “My water heater is leaking.”</p>
          </div>

          <div className="relative flex min-h-[560px] items-center justify-center bg-white px-5 py-16 sm:px-10 lg:min-h-0">
            <div className="absolute left-5 top-5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/40">Live demo · {demoNumberDisplay}</div>
            <HeroCartoon />
            <p className="absolute bottom-6 right-6 rotate-[-3deg] border-2 border-black bg-[#f4f1e8] px-4 py-2 font-mono text-xs font-bold shadow-[4px_4px_0_#000]">VOICEMAIL COULD NEVER.</p>
          </div>
        </div>
      </section>

      <section className="border-b-2 border-black bg-black text-white">
        <div className="mx-auto grid max-w-6xl divide-y-2 divide-white/25 px-5 sm:grid-cols-3 sm:divide-x-2 sm:divide-y-0 sm:px-8">
          {["Keep your current number", "Only missed calls roll over", "Lead details land instantly"].map((item) => (
            <div className="flex items-center gap-3 py-5 text-sm font-extrabold sm:px-6 first:sm:pl-0" key={item}>
              <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-white text-black"><Check className="h-3.5 w-3.5" /></span>{item}
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 sm:py-32" id="how-it-works">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-black/45">How it works</p>
              <h2 className="mt-6 text-5xl font-black leading-[0.92] tracking-[-0.06em] sm:text-7xl">A very short trip from ring to lead.</h2>
            </div>
            <p className="max-w-xl text-lg font-semibold leading-8 text-black/58 lg:justify-self-end">That’s the whole pitch, honestly. Your customer gets a calm answer. Your crew gets a useful lead. You keep doing the work in front of you.</p>
          </div>

          <div className="mt-16 grid border-l-2 border-t-2 border-black lg:grid-cols-3">
            {steps.map((step) => (
              <article className="group min-h-80 border-b-2 border-r-2 border-black bg-white p-7 transition-colors hover:bg-black hover:text-white" key={step.number}>
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-bold">{step.number}</span>
                  <ArrowDown className="h-5 w-5 transition-transform group-hover:translate-y-2" />
                </div>
                <h3 className="mt-24 text-3xl font-black tracking-[-0.045em]">{step.title}</h3>
                <p className="mt-5 text-sm font-semibold leading-6 opacity-60">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y-2 border-black bg-white">
        <div className="mx-auto grid max-w-6xl lg:grid-cols-[0.78fr_1.22fr]">
          <div className="flex flex-col justify-between border-b-2 border-black bg-black p-8 text-white sm:p-12 lg:border-b-0 lg:border-r-2">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-white/45">Your dashboard</p>
              <h2 className="mt-6 text-5xl font-black leading-[0.92] tracking-[-0.06em] sm:text-6xl">No more mystery voicemails.</h2>
              <p className="mt-7 text-base font-semibold leading-7 text-white/58">Every call has a name, a problem, an urgency, and a next move. It’s the call board your business always should have had.</p>
            </div>
            <Link className="mt-12 inline-flex items-center gap-2 text-sm font-extrabold underline decoration-2 underline-offset-4" href="/signup">Create your workspace <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <DashboardPreview />
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-black/45">What Mabel gets</p>
            <h2 className="mt-6 text-5xl font-black leading-[0.92] tracking-[-0.06em] sm:text-7xl">The useful stuff. Not a novel.</h2>
            <p className="mt-8 max-w-md text-lg font-semibold leading-8 text-black/58">The questions fit your business. The output fits on a phone screen. Miracles do happen.</p>
          </div>
          <div className="border-t-2 border-black">
            {capturePoints.map((point, index) => (
              <div className="flex items-center gap-5 border-b-2 border-black py-6" key={point}>
                <span className="grid h-9 w-9 flex-none place-items-center rounded-full border-2 border-black font-mono text-[10px] font-bold">{String(index + 1).padStart(2, "0")}</span>
                <p className="text-xl font-black tracking-[-0.025em] sm:text-2xl">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y-2 border-black bg-black px-5 py-24 text-white sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[1fr_0.72fr] lg:items-center">
          <div>
            <Quote className="h-9 w-9 fill-white" />
            <blockquote className="mt-8 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-6xl">“The team can keep their hands on the job. Mabel keeps a hand on the phone.”</blockquote>
          </div>
          <div className="border-t-2 border-white/25 pt-7 lg:border-l-2 lg:border-t-0 lg:pl-10 lg:pt-0">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-white/45">Built for real work</p>
            <p className="mt-5 text-lg font-semibold leading-8 text-white/65">Plumbers. HVAC crews. Roofers. Med spas. Any team that’s busy serving the customer in front of them and still needs to catch the next one.</p>
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.65fr_1fr]">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-black/45">Fine print, minus the tiny print</p>
            <h2 className="mt-6 text-5xl font-black tracking-[-0.06em] sm:text-6xl">Good questions.</h2>
          </div>
          <div className="border-t-2 border-black">
            {faqs.map((faq) => (
              <details className="group border-b-2 border-black py-6" key={faq.q}>
                <summary className="flex list-none items-center justify-between gap-6 text-xl font-black tracking-[-0.025em] sm:text-2xl">{faq.q}<span className="text-2xl transition-transform group-open:rotate-45">+</span></summary>
                <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-black/58">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y-2 border-black bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <a href="https://raleighaiguy.com/" target="_blank" rel="noreferrer" aria-label="Visit Raleigh AI Guy">
            <Image className="h-24 w-24 rounded-full border-2 border-black object-cover grayscale transition-transform hover:-rotate-3" src="/danny.jpeg" alt="Danny Sullivan, Raleigh AI Guy" width={128} height={128} />
          </a>
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-black/45">A real person is behind this</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.045em]">
              Built by <a className="underline decoration-2 underline-offset-4" href="https://raleighaiguy.com/" target="_blank" rel="noreferrer">Raleigh AI Guy</a>.
            </h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-black/55">I’ll help connect the number, tune Mabel to your business, and make sure the first calls land where they should.</p>
          </div>
          <a className="inline-flex items-center gap-2 text-sm font-extrabold underline decoration-2 underline-offset-4" href="https://raleighaiguy.com/" target="_blank" rel="noreferrer">Visit Raleigh AI Guy <ExternalLink className="h-4 w-4" /></a>
        </div>
      </section>

      <section className="bg-[#f4f1e8] px-5 py-24 sm:px-8 sm:py-36">
        <div className="mx-auto max-w-5xl text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-black/45">Fourteen days free · no card</p>
          <h2 className="mt-7 text-[clamp(4rem,10vw,8rem)] font-black leading-[0.82] tracking-[-0.075em]">Give voicemail<br />the day off.</h2>
          <div className="mt-12 flex flex-col justify-center gap-3 sm:flex-row">
            <Link className="inline-flex h-14 items-center justify-center gap-2 bg-black px-7 font-extrabold text-white transition-transform hover:-translate-y-1" href="/signup">Start free <ArrowRight className="h-4 w-4" /></Link>
            <a className="inline-flex h-14 items-center justify-center gap-2 border-2 border-black bg-white px-7 font-extrabold" href={`tel:${demoNumber}`}><PhoneCall className="h-4 w-4" /> Call Mabel</a>
          </div>
        </div>
      </section>

      <footer className="border-t-2 border-black bg-black px-5 py-9 text-white sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <BrandMark inverted />
            <p className="mt-5 text-xs font-semibold text-white/42">© 2026 · Built by <a className="underline underline-offset-2 hover:text-white" href="https://raleighaiguy.com/" target="_blank" rel="noreferrer">Raleigh AI Guy</a></p>
          </div>
          <nav className="flex flex-wrap gap-6 text-sm font-extrabold text-white/70"><Link href="/blog">Writing</Link><Link href="/login">Sign in</Link><a href={contactHref}>{contactEmail}</a><a href={`tel:${demoNumber}`}>Call demo</a><a href="#how-it-works">How it works</a></nav>
        </div>
      </footer>
    </main>
  );
}

function HeroCartoon() {
  return (
    <svg className="w-full max-w-[460px]" viewBox="0 0 480 500" role="img" aria-label="Cartoon of Mabel catching a ringing phone call while a business owner works">
      <path d="M54 404c66 37 305 36 376-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 10" />
      <path d="M340 101c34-28 66-16 64 22-2 37-46 66-84 78-12-43-12-73 20-100Z" fill="#f4f1e8" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      <text x="337" y="133" fontFamily="monospace" fontSize="15" fontWeight="700">GOT IT.</text>
      <text x="336" y="155" fontFamily="monospace" fontSize="11" fontWeight="700">WHAT&apos;S GOING ON?</text>
      <path d="M288 183c19-26 58-30 78-7 16 18 12 49 2 70l-18 38-89-8-12-45c-5-20 18-28 39-48Z" fill="#fff" stroke="currentColor" strokeWidth="4" />
      <circle cx="312" cy="194" r="37" fill="#f4f1e8" stroke="currentColor" strokeWidth="4" />
      <path d="M282 190c8-34 57-39 67-3-7-7-16-13-28-14-14-1-26 5-39 17Z" fill="#000" />
      <circle cx="299" cy="197" r="3.5" /><circle cx="324" cy="197" r="3.5" />
      <path d="M300 212c8 7 17 7 25 0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M277 219c-17-7-27 5-25 19 2 12 10 27 27 34M349 217c17-8 26 5 23 20-3 13-12 25-28 33" fill="#fff" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M266 224c4-37-12-62-27-70M356 224c-1-39 13-58 30-67" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <rect x="225" y="135" width="28" height="45" rx="7" fill="#000" transform="rotate(-24 225 135)" />
      <path d="M197 146c-8-18-2-33 10-40M183 158c-18-23-14-49 3-66M380 144c11-14 12-27 4-40M396 157c21-20 21-45 7-63" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M262 276c-18 23-24 69-18 119M350 282c12 24 18 67 13 113" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M246 303h116l-14 93h-89Z" fill="#000" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      <path d="M281 333h45M281 351h32M281 369h54" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <circle cx="337" cy="332" r="8" fill="#fff" />
      <path d="M111 205c-30 0-48 20-47 50 1 26 20 47 48 47 31 0 50-19 49-49-1-29-19-48-50-48Z" fill="#f4f1e8" stroke="currentColor" strokeWidth="4" />
      <path d="M73 240c10-36 62-48 82-10-15-6-30-4-43 1-15 6-28 10-39 9Z" fill="#000" />
      <circle cx="99" cy="256" r="3.5" /><circle cx="127" cy="256" r="3.5" />
      <path d="M103 275c7-5 16-5 23 0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M81 299c-21 21-35 63-35 103M143 301c20 20 32 60 30 100" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M74 315h78l14 87H58Z" fill="#fff" stroke="currentColor" strokeWidth="4" />
      <path d="M88 347h46M88 366h33" stroke="#000" strokeWidth="5" strokeLinecap="round" />
      <path d="M152 323l25-25 22 20-27 27" fill="#f4f1e8" stroke="currentColor" strokeWidth="4" />
      <path d="M54 405h374" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function DashboardPreview() {
  const calls = [
    { name: "Maya T.", issue: "Water heater leaking", urgency: "Emergency", value: "$1,400", time: "2m ago" },
    { name: "Chris R.", issue: "Kitchen drain fully blocked", urgency: "Urgent", value: "$550", time: "18m ago" },
    { name: "Alex J.", issue: "Quote for faucet replacement", urgency: "Standard", value: "$150", time: "1h ago" }
  ];
  return (
    <div className="bg-[#f4f1e8] p-5 sm:p-10">
      <div className="overflow-hidden border-2 border-black bg-white shadow-[10px_10px_0_#000]">
        <div className="flex items-center justify-between border-b-2 border-black px-4 py-3"><div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-black" /><span className="h-2.5 w-2.5 rounded-full border border-black" /><span className="h-2.5 w-2.5 rounded-full border border-black" /></div><p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em]">Live call board</p></div>
        <div className="grid grid-cols-3 border-b-2 border-black">
          {[['Calls', '12'], ['Good leads', '9'], ['Caught', '$6.8k']].map(([label, value]) => <div className="border-r-2 border-black p-4 last:border-r-0" key={label}><p className="font-mono text-[8px] font-bold uppercase text-black/45">{label}</p><p className="mt-2 text-2xl font-black tracking-[-0.05em]">{value}</p></div>)}
        </div>
        <div className="px-4 py-3"><p className="text-xs font-black">Recent calls</p></div>
        <div className="divide-y-2 divide-black border-t-2 border-black">
          {calls.map((call) => <div className="grid grid-cols-[1fr_auto] gap-4 p-4" key={call.name}><div><div className="flex items-center gap-2"><span className={`border border-black px-1.5 py-0.5 font-mono text-[7px] font-bold uppercase ${call.urgency === 'Emergency' ? 'bg-black text-white' : ''}`}>{call.urgency}</span><span className="text-[9px] font-bold text-black/35">{call.time}</span></div><p className="mt-2 text-sm font-black">{call.name}</p><p className="mt-1 text-[10px] font-semibold text-black/50">{call.issue}</p></div><div className="text-right"><p className="font-mono text-[7px] font-bold uppercase text-black/35">Est.</p><p className="mt-1 text-sm font-black">{call.value}</p></div></div>)}
        </div>
      </div>
    </div>
  );
}
