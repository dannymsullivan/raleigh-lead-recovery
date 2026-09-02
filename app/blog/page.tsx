import { ArrowRight, Clock3, FileText, Mail, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "../components/brand-mark";
import { blogCategories, blogPosts, siteUrl } from "@/lib/blog";
import { contactEmail, contactHref } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Field Notes | Raleigh Lead Recovery",
  description: "Practical missed-call recovery, call-forwarding, and local lead-capture advice for busy service businesses.",
  alternates: { canonical: `${siteUrl}/blog` }
};

const featuredPost = blogPosts[0];
const remainingPosts = blogPosts.slice(1);

export default function BlogIndexPage() {
  return (
    <main className="brand-surface min-h-screen bg-[#f5f8fc] text-[#111b35]">
      <header className="border-b-2 border-black">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <BrandMark />
          <div className="flex items-center gap-3 sm:gap-6">
            <Link className="hidden text-sm font-extrabold hover:underline hover:decoration-2 hover:underline-offset-4 sm:block" href="/">Home</Link>
            <a className="hidden text-sm font-extrabold hover:underline hover:decoration-2 hover:underline-offset-4 md:block" href={contactHref}>Contact</a>
            <Link className="inline-flex h-11 items-center gap-2 bg-black px-4 text-sm font-extrabold text-white transition-transform hover:-translate-y-0.5 sm:px-5" href="/signup">
              Start free <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </header>

      <section className="border-b-2 border-black">
        <div className="mx-auto grid max-w-6xl lg:grid-cols-[1.12fr_0.88fr]">
          <div className="px-5 py-20 sm:px-8 sm:py-28 lg:border-r-2 lg:border-black lg:pr-16">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-black/45">Raleigh Lead Recovery field notes · Raleigh, NC</p>
            <h1 className="mt-8 max-w-4xl text-[clamp(4.3rem,10vw,7.8rem)] font-black leading-[0.81] tracking-[-0.075em]">
              Better calls.<br />Better jobs.
            </h1>
            <p className="mt-9 max-w-2xl text-lg font-semibold leading-8 text-black/60 sm:text-xl">
              Plain-English guides for service businesses that would rather capture the next customer than listen to another mystery voicemail.
            </p>
          </div>

          <div className="flex min-h-[390px] flex-col justify-between bg-black p-7 text-white sm:p-10 lg:min-h-0">
            <div className="flex items-start justify-between gap-6">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Issue 001</span>
              <span className="h-3 w-3 rounded-full bg-white" />
            </div>
            <div>
              <p className="max-w-md text-3xl font-black leading-[1.02] tracking-[-0.045em] sm:text-4xl">Useful enough to read between jobs.</p>
              <dl className="mt-10 grid grid-cols-3 border-l border-t border-white/30">
                <LedgerStat label="Guides" value={String(blogPosts.length)} />
                <LedgerStat label="Fluff" value="0" />
                <LedgerStat label="Focus" value="Local" />
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-2 border-black bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-5 sm:px-8">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/40">Browse the board</span>
          {blogCategories.map((category, index) => (
            <span className="inline-flex items-center gap-2 text-sm font-black" key={category}>
              <span className="font-mono text-[9px] text-black/35">{String(index + 1).padStart(2, "0")}</span>{category}
            </span>
          ))}
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-black/45">Start here</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.055em] sm:text-5xl">The lead story.</h2>
            </div>
            <span className="hidden font-mono text-xs font-bold text-black/35 sm:block">UPDATED {featuredPost.updatedAt}</span>
          </div>

          <Link className="group grid border-2 border-black bg-white lg:grid-cols-[1fr_0.36fr]" href={`/blog/${featuredPost.slug}`}>
            <div className="p-7 sm:p-10 lg:border-r-2 lg:border-black">
              <PostMeta post={featuredPost} />
              <h3 className="mt-12 max-w-4xl text-4xl font-black leading-[0.96] tracking-[-0.055em] sm:text-6xl">{featuredPost.title}</h3>
              <p className="mt-7 max-w-2xl text-base font-semibold leading-7 text-black/58 sm:text-lg">{featuredPost.description}</p>
            </div>
            <div className="flex min-h-52 flex-col justify-between border-t-2 border-black bg-[#f4f1e8] p-7 lg:min-h-0 lg:border-t-0">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/40">Featured guide</span>
              <span className="inline-flex items-center gap-3 text-xl font-black">Read it <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" aria-hidden="true" /></span>
            </div>
          </Link>
        </div>
      </section>

      <section className="border-y-2 border-black bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-[0.72fr_1fr]">
            <div className="border-b-2 border-black bg-black p-7 text-white sm:p-10 lg:border-b-0 lg:border-r-2">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-white/45">The rest of the board</p>
              <h2 className="mt-6 text-5xl font-black leading-[0.9] tracking-[-0.06em] sm:text-6xl">Notes from the front desk.</h2>
              <p className="mt-7 max-w-md text-base font-semibold leading-7 text-white/58">Forwarding, job value, voicemail, and the small operational choices that decide whether a missed ring becomes revenue.</p>
            </div>
            <div className="divide-y-2 divide-black">
              {remainingPosts.map((post, index) => (
                <Link className="group grid gap-8 p-7 transition-colors hover:bg-[#f4f1e8] sm:grid-cols-[52px_1fr_auto] sm:items-start sm:p-9" href={`/blog/${post.slug}`} key={post.slug}>
                  <span className="font-mono text-xs font-bold text-black/35">{String(index + 2).padStart(2, "0")}</span>
                  <div>
                    <PostMeta post={post} />
                    <h3 className="mt-4 text-2xl font-black leading-[1.02] tracking-[-0.035em] sm:text-3xl">{post.title}</h3>
                    <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-black/55">{post.description}</p>
                  </div>
                  <ArrowRight className="hidden h-5 w-5 transition-transform group-hover:translate-x-2 sm:block" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-8 border-2 border-black bg-[#f4f1e8] p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-black/45">Have a missed-call question?</p>
            <h2 className="mt-5 max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl">Send it to the person building Raleigh Lead Recovery.</h2>
          </div>
          <a className="inline-flex h-14 items-center justify-center gap-3 bg-black px-6 font-extrabold text-white transition-transform hover:-translate-y-1" href={contactHref}>
            <Mail className="h-4 w-4" aria-hidden="true" /> {contactEmail}
          </a>
        </div>
      </section>

      <footer className="border-t-2 border-black bg-black px-5 py-9 text-white sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div><BrandMark inverted /><p className="mt-5 text-xs font-semibold text-white/42">© 2026 Raleigh Lead Recovery</p></div>
          <nav className="flex flex-wrap gap-6 text-sm font-extrabold text-white/70"><Link href="/">Home</Link><Link href="/signup">Start free</Link><a href={contactHref}>Contact</a></nav>
        </div>
      </footer>
    </main>
  );
}

function LedgerStat({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-r border-white/30 p-3"><dt className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-white/40">{label}</dt><dd className="mt-3 text-lg font-black">{value}</dd></div>;
}

function PostMeta({ post }: { post: typeof blogPosts[number] }) {
  const Icon = post.format === "video" ? PlayCircle : FileText;
  return (
    <div className="flex flex-wrap items-center gap-3 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-black/45">
      <span className="inline-flex items-center gap-2 text-black"><Icon className="h-3.5 w-3.5" aria-hidden="true" />{post.format}</span>
      <span>{post.category}</span>
      <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{post.readMinutes} min</span>
    </div>
  );
}
