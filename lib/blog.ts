import type { Metadata } from "next";

export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "callout"; title: string; text: string }
  | { type: "steps"; items: Array<{ title: string; text: string }> };

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: "Missed calls" | "Call forwarding" | "Revenue" | "Operations" | "Video";
  format: "article" | "video";
  publishedAt: string;
  updatedAt: string;
  readMinutes: number;
  targetQuery: string;
  buyerStage: "Awareness" | "Consideration" | "Decision" | "Implementation";
  video?: {
    title: string;
    embedUrl: string;
    duration: string;
  };
  blocks: BlogBlock[];
};

export const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://raleigh-lead-recovery.vercel.app";

export const blogPosts: BlogPost[] = [
  {
    slug: "plumbing-calls-going-to-voicemail",
    title: "What happens when plumbing calls go to voicemail?",
    description:
      "A practical breakdown for Raleigh plumbers on why missed calls are expensive, which calls matter most, and how to catch them without changing the shop number.",
    category: "Missed calls",
    format: "article",
    publishedAt: "2026-07-09",
    updatedAt: "2026-07-09",
    readMinutes: 5,
    targetQuery: "plumbing calls going to voicemail",
    buyerStage: "Awareness",
    blocks: [
      {
        type: "paragraph",
        text:
          "When a plumbing call goes to voicemail, the customer often keeps moving. They may leave a message, but urgent plumbing issues usually push people to call the next company that answers."
      },
      {
        type: "paragraph",
        text:
          "For a small plumbing shop, the risk is not just a missed conversation. It is a missed water heater, drain backup, leak repair, or emergency callback that could have been captured with a fast response."
      },
      {
        type: "heading",
        text: "The calls most likely to matter"
      },
      {
        type: "list",
        items: [
          "Water heater failures where the homeowner wants help today.",
          "Active leaks where the caller is stressed and calling multiple plumbers.",
          "Drain and sewer backups where urgency is clear.",
          "No-water or no-hot-water calls after hours.",
          "Quote requests that turn into booked work when the callback is fast."
        ]
      },
      {
        type: "heading",
        text: "Why voicemail is weak for urgent jobs"
      },
      {
        type: "paragraph",
        text:
          "Voicemail asks the customer to wait without giving them confidence that anyone saw the problem. That is fine for a low-priority question. It is weaker when water is leaking, a drain is backed up, or a water heater is down."
      },
      {
        type: "callout",
        title: "Simple test",
        text:
          "Look at the last week of missed calls. If even one caller would have been worth calling back within minutes, missed-call recovery is worth testing."
      },
      {
        type: "heading",
        text: "A better missed-call flow"
      },
      {
        type: "steps",
        items: [
          {
            title: "The normal shop number rings first",
            text: "Customers still call the number they already know. Nothing changes on Google, trucks, cards, or the website."
          },
          {
            title: "Only missed calls roll over",
            text: "Busy, unanswered, or after-hours calls forward to an intake assistant."
          },
          {
            title: "The plumbing issue gets captured",
            text: "Name, callback number, address, issue, urgency, and timing are collected before the lead cools off."
          },
          {
            title: "The owner gets the summary",
            text: "Instead of a mystery voicemail, the owner gets a usable callback summary."
          }
        ]
      },
      {
        type: "quote",
        text:
          "The goal is not to replace your phone. The goal is to catch the calls that your phone already missed."
      }
    ]
  },
  {
    slug: "missed-call-forwarding-for-plumbers",
    title: "Missed-call forwarding for plumbers: how it works",
    description:
      "Learn how missed-call forwarding lets a plumbing shop keep its main number while routing only unanswered, busy, or after-hours calls to a lead intake assistant.",
    category: "Call forwarding",
    format: "article",
    publishedAt: "2026-07-09",
    updatedAt: "2026-07-09",
    readMinutes: 6,
    targetQuery: "missed call forwarding for plumbers",
    buyerStage: "Implementation",
    blocks: [
      {
        type: "paragraph",
        text:
          "Missed-call forwarding lets a plumbing company keep its current public phone number while routing only the calls it does not answer. The customer still calls the same shop number."
      },
      {
        type: "paragraph",
        text:
          "The forwarding rule usually applies when the line is busy, nobody answers, or the call happens after hours. Those calls can be sent to a recovery number that answers, captures details, and alerts the owner."
      },
      {
        type: "heading",
        text: "What stays the same"
      },
      {
        type: "list",
        items: [
          "The company phone number customers see online.",
          "The normal ring path during business hours.",
          "The owner's ability to answer calls directly.",
          "The option to turn forwarding off."
        ]
      },
      {
        type: "heading",
        text: "What changes"
      },
      {
        type: "paragraph",
        text:
          "Instead of a missed call dropping into voicemail, an intake assistant answers and asks plumbing-specific questions. The owner receives the lead details by text or email."
      },
      {
        type: "steps",
        items: [
          {
            title: "Caller reaches the normal number",
            text: "A homeowner calls the shop number from Google, the website, a truck, or a referral."
          },
          {
            title: "The shop misses the call",
            text: "The plumber is under a sink, driving, on another call, or closed for the day."
          },
          {
            title: "Forwarding sends the call to intake",
            text: "The recovery assistant answers and gathers the job details."
          },
          {
            title: "The owner gets context",
            text: "The alert includes the callback number, issue, address, urgency, and timing."
          }
        ]
      },
      {
        type: "callout",
        title: "Pilot recommendation",
        text:
          "Run forwarding for 7 days before changing anything else. If the captured calls are useful, keep it. If they are not, turn it off."
      },
      {
        type: "heading",
        text: "What not to do"
      },
      {
        type: "list",
        items: [
          "Do not make customers call a new number just to test the idea.",
          "Do not promise dispatch times the shop cannot honor.",
          "Do not quote pricing from the intake assistant unless the shop has approved exact rules.",
          "Do not mix multiple real clients into one shared intake number without reliable routing."
        ]
      }
    ]
  },
  {
    slug: "how-much-is-a-missed-plumbing-call-worth",
    title: "How much is a missed plumbing call worth?",
    description:
      "A simple way for plumbing owners to estimate the value of missed calls without pretending every call turns into closed revenue.",
    category: "Revenue",
    format: "article",
    publishedAt: "2026-07-09",
    updatedAt: "2026-07-09",
    readMinutes: 4,
    targetQuery: "how much is a missed plumbing call worth",
    buyerStage: "Consideration",
    blocks: [
      {
        type: "paragraph",
        text:
          "A missed plumbing call is worth the expected value of the job, not the full invoice amount. The clean way to estimate it is captured call value multiplied by close rate."
      },
      {
        type: "callout",
        title: "Simple formula",
        text:
          "Expected value = estimated job value x chance of booking the job. A $1,000 job with a 40% close rate has an expected value of $400."
      },
      {
        type: "heading",
        text: "Use conservative value bands"
      },
      {
        type: "paragraph",
        text:
          "Do not treat every call like a guaranteed sale. A better report groups captured calls into rough bands: small repair, standard job, urgent job, and unknown. That keeps the audit credible."
      },
      {
        type: "list",
        items: [
          "Small repair: simple fixture, minor leak, basic troubleshooting.",
          "Standard job: water heater issue, drain cleaning, recurring repair need.",
          "Urgent job: active leak, sewer backup, no water, no hot water.",
          "Unknown: caller did not provide enough detail."
        ]
      },
      {
        type: "heading",
        text: "What the 7-day audit should prove"
      },
      {
        type: "steps",
        items: [
          {
            title: "Missed-call volume",
            text: "How many calls would have gone unanswered or to voicemail?"
          },
          {
            title: "Lead quality",
            text: "Were the calls real plumbing jobs, spam, vendor calls, or low-priority questions?"
          },
          {
            title: "Urgency",
            text: "Which calls needed a fast callback?"
          },
          {
            title: "Pipeline value",
            text: "What estimated value did the captured job details represent?"
          }
        ]
      },
      {
        type: "quote",
        text:
          "The honest claim is pipeline captured, not revenue closed. That distinction builds trust with owners."
      }
    ]
  },
  {
    slug: "video-demo-missed-call-recovery",
    title: "Video script: show a plumber the missed-call demo in 60 seconds",
    description:
      "A short video outline you can record for Facebook, Instagram, LinkedIn, or YouTube Shorts to explain Raleigh Lead Recovery to local plumbers.",
    category: "Video",
    format: "video",
    publishedAt: "2026-07-09",
    updatedAt: "2026-07-09",
    readMinutes: 3,
    targetQuery: "missed call recovery demo for plumbers",
    buyerStage: "Consideration",
    blocks: [
      {
        type: "paragraph",
        text:
          "This is a short video script for explaining missed-call recovery to plumbing owners. Record it vertically for Instagram Reels, Facebook, YouTube Shorts, and LinkedIn."
      },
      {
        type: "heading",
        text: "Hook"
      },
      {
        type: "quote",
        text:
          "Raleigh plumbers: what happens when a customer calls while your hands are under a sink?"
      },
      {
        type: "heading",
        text: "60-second outline"
      },
      {
        type: "steps",
        items: [
          {
            title: "Show the problem",
            text: "Hold up your phone or show the demo page. Say that urgent calls often arrive when the owner cannot answer."
          },
          {
            title: "Show the demo number",
            text: "Ask viewers to call 984-299-2155 and pretend they have a leak, backed-up drain, or water heater issue."
          },
          {
            title: "Explain the flow",
            text: "The assistant captures the issue, address, callback number, urgency, and timing."
          },
          {
            title: "Make the offer",
            text: "You are looking for 3 Raleigh-area plumbing shops to test it free for 7 days."
          }
        ]
      },
      {
        type: "heading",
        text: "Caption"
      },
      {
        type: "paragraph",
        text:
          "I built Raleigh Lead Recovery for plumbers who miss calls while they are on jobs. Your current number stays the same. Only missed calls roll over. Want to test it for a week?"
      },
      {
        type: "callout",
        title: "Publishing note",
        text:
          "After you upload the video to YouTube, replace this post with the embed URL and keep the transcript on the page for SEO."
      }
    ]
  }
];

export const blogCategories = Array.from(new Set(blogPosts.map((post) => post.category)));

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getRelatedPosts(post: BlogPost): BlogPost[] {
  return blogPosts
    .filter((candidate) => candidate.slug !== post.slug)
    .sort((a, b) => {
      const categoryScore = Number(b.category === post.category) - Number(a.category === post.category);
      if (categoryScore !== 0) {
        return categoryScore;
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, 3);
}

export function getBlogPostUrl(post: BlogPost): string {
  return `${siteUrl}/blog/${post.slug}`;
}

export function getBlogMetadata(post: BlogPost): Metadata {
  const url = getBlogPostUrl(post);

  return {
    title: `${post.title} | Raleigh Lead Recovery`,
    description: post.description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt
    }
  };
}
