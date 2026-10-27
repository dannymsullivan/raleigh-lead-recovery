import { PublicSiteFooter } from "@/app/components/public-site-footer";
import { ArrowRight, CalendarDays, Clock3, FileText, Mail, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicSiteNav } from "../../components/public-site-nav";
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
import { contactHref } from "@/lib/contact";

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
    <main className="brand-surface min-h-screen rlr-home rlr-retro retro-editorial">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <PublicSiteNav cta={{ href: "/get-started", label: "Try two weeks free" }} />

      <article>
        <section className="border-b-2 border-black px-5 py-16 sm:px-8 lg:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.74fr_0.26fr] lg:items-end">
            <div>
              <Link className="mb-8 inline-flex items-center gap-2 text-sm font-black text-black/50 hover:text-black" href="/blog">
                <ArrowRight className="h-4 w-4 rotate-180" aria-hidden="true" />
                Back to blog
              </Link>
              <div className="mb-6 flex flex-wrap items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black/45">
                <span className="inline-flex items-center gap-2 text-black">
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
              <h1 className="max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                {post.title}
              </h1>
              <p className="mt-7 max-w-3xl text-lg font-semibold leading-8 text-black/58 sm:text-xl">{post.description}</p>
            </div>

            <aside className="border-2 border-black bg-black p-6 text-white">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Field note</p>
              <p className="mt-8 text-3xl font-black tracking-[-0.05em]">Read it between jobs.</p>
              <p className="mt-5 text-sm font-semibold leading-6 text-white/58">A practical answer, written for the person who still has to pick up the phone.</p>
            </aside>
          </div>
        </section>

        {post.video ? (
          <section className="px-5 pb-12">
            <div className="mx-auto max-w-5xl overflow-hidden border-2 border-black bg-black">
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
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.72fr_0.28fr]">
            <div className="border-2 border-black bg-white px-6 py-8 sm:px-10 sm:py-12">
              <div className="prose-like">
                {post.blocks.map((block, index) => (
                  <BlogBlockRenderer block={block} key={`${block.type}-${index}`} />
                ))}
              </div>
            </div>

            <aside className="space-y-5">
              <div className="border-2 border-black bg-black p-6 text-white">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Talk to Danny</p>
                <h2 className="mt-4 text-2xl font-black tracking-[-0.04em]">Have a missed-call question?</h2>
                <p className="mt-4 text-sm font-semibold leading-6 text-white/58">
                  Email Danny with your question and the type of business you run.
                </p>
                <a className="mt-6 inline-flex w-full items-center justify-center gap-2 border-2 border-white bg-white px-4 py-4 text-sm font-black text-black hover:bg-transparent hover:text-white" href={contactHref}><Mail className="h-4 w-4" /> Email Danny</a>
              </div>

              <div className="border-2 border-black bg-white p-6">
                <h2 className="text-lg font-black tracking-[-0.03em]">Keep reading</h2>
                <div className="mt-4 grid gap-4">
                  {relatedPosts.map((related) => (
                    <Link key={related.slug} className="group border-t-2 border-black pt-4 first:border-t-0 first:pt-0" href={`/blog/${related.slug}`}>
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-black/40">{related.category}</p>
                      <h3 className="mt-2 font-black leading-snug group-hover:underline">{related.title}</h3>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </article>

      <PublicSiteFooter />
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
      <div className="my-8 border-2 border-black bg-[#f4f1e8] p-5">
        <p className="text-base font-black text-black">{block.title}</p>
        <p className="mt-2 text-base leading-7 text-black/60">{block.text}</p>
      </div>
    );
  }

  return (
    <div className="my-8 grid gap-4">
      {block.items.map((item, index) => (
        <div key={item.title} className="grid gap-3 border-t-2 border-black pt-5 sm:grid-cols-[72px_1fr]">
          <p className="font-mono text-xs font-bold text-black/40">{String(index + 1).padStart(2, "0")}</p>
          <div>
            <h3 className="text-xl font-black tracking-normal">{item.title}</h3>
            <p className="mt-2 text-base leading-7 text-black/60">{item.text}</p>
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
    keywords: [post.targetQuery, post.category, "service businesses", "missed call recovery"],
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
