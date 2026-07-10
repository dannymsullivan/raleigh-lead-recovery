import { ArrowRight, Clock3, FileText, PlayCircle, Search, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { blogCategories, blogPosts, siteUrl } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog | Raleigh Lead Recovery",
  description:
    "Practical missed-call recovery, call forwarding, and local lead capture advice for Raleigh plumbing shops.",
  alternates: {
    canonical: `${siteUrl}/blog`
  }
};

const featuredPost = blogPosts[0];
const remainingPosts = blogPosts.slice(1);

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen bg-[#f3f4ee] text-[#090d07]">
      <header className="border-b border-[#c8c9bf] bg-[#080d06] px-5 py-6 text-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link className="inline-flex min-w-0 items-center gap-3 font-bold" href="/">
            <span className="flex h-10 w-10 items-center justify-center rounded bg-[#cfff04] text-[#080d06]">
              <Wrench className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="truncate">Raleigh Lead Recovery</span>
          </Link>
          <div className="flex shrink-0 items-center gap-4 text-sm font-black">
            <Link className="hidden text-white/72 hover:text-white sm:inline" href="/">
              Home
            </Link>
            <Link className="rounded bg-[#cfff04] px-4 py-3 text-[#080d06] hover:bg-[#bbed00]" href="/#request">
              Free audit
            </Link>
          </div>
        </nav>
      </header>

      <section className="px-5 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-sm font-black text-[#d74322]">
              <Search className="h-4 w-4" aria-hidden="true" />
              SEO library for Raleigh plumbers
            </p>
            <h1 className="mt-6 text-5xl font-black leading-[1.02] tracking-normal sm:text-6xl lg:text-7xl">
              Missed-call recovery advice for busy plumbing shops.
            </h1>
            <p className="mt-7 max-w-2xl text-xl leading-9 text-[#41453d]">
              Practical articles, scripts, and video-ready explainers about catching plumbing leads that would otherwise go to voicemail.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {blogCategories.map((category) => (
              <span key={category} className="rounded border border-[#c8c9bf] bg-[#fbfcf6] px-4 py-2 text-sm font-black">
                {category}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <Link
            className="group grid min-h-[430px] content-between border border-[#c8c9bf] bg-[#fbfcf6] p-8 transition hover:border-[#090d07] sm:p-10"
            href={`/blog/${featuredPost.slug}`}
          >
            <div>
              <PostMeta post={featuredPost} />
              <h2 className="mt-7 max-w-3xl text-4xl font-black leading-tight tracking-normal sm:text-5xl">
                {featuredPost.title}
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#41453d]">{featuredPost.description}</p>
            </div>
            <div className="mt-10 inline-flex items-center gap-2 font-black">
              Read the guide
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" aria-hidden="true" />
            </div>
          </Link>

          <aside className="border border-[#c8c9bf] bg-[#ecede6] p-8 sm:p-10">
            <p className="text-sm font-black text-[#d74322]">Content plan</p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-normal">Start with questions plumbers already ask.</h2>
            <p className="mt-5 leading-8 text-[#41453d]">
              The first cluster targets missed calls, forwarding, job value, and short video demos. Each post has one clear query, a direct answer, and a path back to the free audit.
            </p>
            <Link className="mt-8 inline-flex items-center gap-2 rounded bg-[#090d07] px-5 py-4 font-black text-white hover:bg-[#20251d]" href="/#request">
              Request free audit
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </section>

      <section className="border-y border-[#c8c9bf] bg-[#fbfcf6] px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-black text-[#d74322]">Latest posts</p>
              <h2 className="mt-3 text-4xl font-black tracking-normal">Articles and video scripts</h2>
            </div>
            <p className="max-w-xl text-[#41453d]">
              Use article posts for search and video posts for content you can publish on YouTube, Facebook, Instagram, and LinkedIn.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {remainingPosts.map((post) => (
              <Link key={post.slug} className="group border border-[#c8c9bf] bg-white p-6 transition hover:border-[#090d07]" href={`/blog/${post.slug}`}>
                <PostMeta post={post} />
                <h3 className="mt-5 text-2xl font-black leading-tight tracking-normal">{post.title}</h3>
                <p className="mt-4 line-clamp-4 leading-7 text-[#41453d]">{post.description}</p>
                <span className="mt-8 inline-flex items-center gap-2 font-black">
                  Open
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#f3f4ee] px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 text-sm text-[#41453d] sm:flex-row">
          <p>© 2026 Raleigh Lead Recovery</p>
          <div className="flex gap-6">
            <Link className="font-semibold text-[#090d07]" href="/">
              Home
            </Link>
            <Link className="font-semibold text-[#090d07]" href="/#request">
              Free audit
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function PostMeta({ post }: { post: typeof blogPosts[number] }) {
  const Icon = post.format === "video" ? PlayCircle : FileText;

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs font-black uppercase text-[#4d5148]">
      <span className="inline-flex items-center gap-2 text-[#d74322]">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {post.format}
      </span>
      <span>{post.category}</span>
      <span className="inline-flex items-center gap-1">
        <Clock3 className="h-4 w-4" aria-hidden="true" />
        {post.readMinutes} min
      </span>
    </div>
  );
}
