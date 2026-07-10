import { ArrowRight, CalendarDays, Clock3, FileText, PlayCircle, Search, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  blogPosts,
  getBlogMetadata,
  getBlogPost,
  getBlogPostUrl,
  getRelatedPosts,
  siteUrl,
  type BlogBlock,
  type BlogPost
} from "@/lib/blog";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: "Post not found | Raleigh Lead Recovery"
    };
  }

  return getBlogMetadata(post);
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(post);
  const jsonLd = buildBlogSchema(post);
  const FormatIcon = post.format === "video" ? PlayCircle : FileText;

  return (
    <main className="min-h-screen bg-[#f3f4ee] text-[#090d07]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <header className="border-b border-[#c8c9bf] bg-[#080d06] px-5 py-6 text-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link className="inline-flex min-w-0 items-center gap-3 font-bold" href="/">
            <span className="flex h-10 w-10 items-center justify-center rounded bg-[#cfff04] text-[#080d06]">
              <Wrench className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="truncate">Raleigh Lead Recovery</span>
          </Link>
          <div className="flex shrink-0 items-center gap-4 text-sm font-black">
            <Link className="hidden text-white/72 hover:text-white sm:inline" href="/blog">
              Blog
            </Link>
            <Link className="rounded bg-[#cfff04] px-4 py-3 text-[#080d06] hover:bg-[#bbed00]" href="/#request">
              Free audit
            </Link>
          </div>
        </nav>
      </header>

      <article>
        <section className="px-5 py-16 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.72fr_0.28fr] lg:items-end">
            <div>
              <Link className="mb-8 inline-flex items-center gap-2 text-sm font-black text-[#4d5148] hover:text-[#090d07]" href="/blog">
                <ArrowRight className="h-4 w-4 rotate-180" aria-hidden="true" />
                Back to blog
              </Link>
              <div className="mb-6 flex flex-wrap items-center gap-3 text-xs font-black uppercase text-[#4d5148]">
                <span className="inline-flex items-center gap-2 text-[#d74322]">
                  <FormatIcon className="h-4 w-4" aria-hidden="true" />
                  {post.format}
                </span>
                <span>{post.category}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  {post.readMinutes} min
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  Updated {formatDate(post.updatedAt)}
                </span>
              </div>
              <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-normal sm:text-6xl lg:text-7xl">
                {post.title}
              </h1>
              <p className="mt-7 max-w-3xl text-xl leading-9 text-[#41453d]">{post.description}</p>
            </div>

            <aside className="border border-[#c8c9bf] bg-[#fbfcf6] p-6">
              <p className="inline-flex items-center gap-2 text-sm font-black text-[#d74322]">
                <Search className="h-4 w-4" aria-hidden="true" />
                SEO target
              </p>
              <dl className="mt-5 grid gap-4 text-sm">
                <div>
                  <dt className="font-black">Query</dt>
                  <dd className="mt-1 text-[#41453d]">{post.targetQuery}</dd>
                </div>
                <div>
                  <dt className="font-black">Buyer stage</dt>
                  <dd className="mt-1 text-[#41453d]">{post.buyerStage}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </section>

        {post.video ? (
          <section className="px-5 pb-12">
            <div className="mx-auto max-w-5xl overflow-hidden border border-[#c8c9bf] bg-[#080d06]">
              <div className="aspect-video">
                <iframe
                  className="h-full w-full"
                  src={post.video.embedUrl}
                  title={post.video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="border-t border-white/10 p-5 text-white">
                <p className="font-black">{post.video.title}</p>
                <p className="mt-1 text-sm text-white/62">{post.video.duration}</p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="px-5 pb-20">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.7fr_0.3fr]">
            <div className="border border-[#c8c9bf] bg-[#fbfcf6] px-6 py-8 sm:px-10 sm:py-12">
              <div className="prose-like">
                {post.blocks.map((block, index) => (
                  <BlogBlockRenderer block={block} key={`${block.type}-${index}`} />
                ))}
              </div>
            </div>

            <aside className="space-y-5">
              <div className="border border-[#c8c9bf] bg-[#ecede6] p-6">
                <h2 className="text-2xl font-black tracking-normal">Try it on real missed calls.</h2>
                <p className="mt-4 leading-7 text-[#41453d]">
                  Raleigh Lead Recovery answers the calls your plumbing shop already misses and texts the lead details to the owner.
                </p>
                <Link className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded bg-[#090d07] px-5 py-4 font-black text-white hover:bg-[#20251d]" href="/#request">
                  Start free audit
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </div>

              <div className="border border-[#c8c9bf] bg-[#fbfcf6] p-6">
                <h2 className="text-lg font-black tracking-normal">Related</h2>
                <div className="mt-4 grid gap-4">
                  {relatedPosts.map((related) => (
                    <Link key={related.slug} className="group border-t border-[#c8c9bf] pt-4 first:border-t-0 first:pt-0" href={`/blog/${related.slug}`}>
                      <p className="text-sm font-black text-[#d74322]">{related.category}</p>
                      <h3 className="mt-2 font-black leading-snug group-hover:underline">{related.title}</h3>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </article>

      <footer className="border-t border-[#c8c9bf] bg-[#f3f4ee] px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 text-sm text-[#41453d] sm:flex-row">
          <p>© 2026 Raleigh Lead Recovery</p>
          <div className="flex gap-6">
            <Link className="font-semibold text-[#090d07]" href="/blog">
              Blog
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

function BlogBlockRenderer({ block }: { block: BlogBlock }) {
  if (block.type === "paragraph") {
    return <p>{block.text}</p>;
  }

  if (block.type === "heading") {
    return <h2>{block.text}</h2>;
  }

  if (block.type === "list") {
    return (
      <ul>
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  if (block.type === "quote") {
    return <blockquote>{block.text}</blockquote>;
  }

  if (block.type === "callout") {
    return (
      <div className="my-8 border-l-4 border-[#cfff04] bg-[#ecede6] p-5">
        <p className="text-base font-black text-[#090d07]">{block.title}</p>
        <p className="mt-2 text-base leading-7 text-[#41453d]">{block.text}</p>
      </div>
    );
  }

  return (
    <div className="my-8 grid gap-4">
      {block.items.map((item, index) => (
        <div key={item.title} className="grid gap-3 border-t border-[#c8c9bf] pt-5 sm:grid-cols-[72px_1fr]">
          <p className="text-sm font-black text-[#4d5148]">{String(index + 1).padStart(2, "0")}</p>
          <div>
            <h3 className="text-xl font-black tracking-normal">{item.title}</h3>
            <p className="mt-2 text-base leading-7 text-[#41453d]">{item.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function buildBlogSchema(post: BlogPost) {
  const url = getBlogPostUrl(post);
  const base = {
    "@context": "https://schema.org",
    "@type": post.format === "video" ? "BlogPosting" : "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: url,
    articleSection: post.category,
    keywords: [post.targetQuery, post.category, "Raleigh plumbers", "missed call recovery"],
    author: {
      "@type": "Person",
      name: "Danny Sullivan",
      url: "https://www.linkedin.com/in/danny-sullivan-raleigh"
    },
    publisher: {
      "@type": "Organization",
      name: "Raleigh Lead Recovery",
      url: siteUrl
    },
    image: `${siteUrl}/plumber.webp`
  };

  if (!post.video) {
    return base;
  }

  return {
    ...base,
    video: {
      "@type": "VideoObject",
      name: post.video.title,
      description: post.description,
      uploadDate: post.publishedAt,
      embedUrl: post.video.embedUrl,
      duration: post.video.duration
    }
  };
}
