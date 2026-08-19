import posthog from "posthog-js";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?.trim();

if (projectToken) {
  posthog.init(projectToken, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com",
    defaults: "2026-05-30",
    person_profiles: "identified_only",
  });

  const captureElement = (element: Element): void => {
    const eventName = element.getAttribute("data-analytics-event");
    if (!eventName) return;
    posthog.capture(eventName, {
      location: element.getAttribute("data-analytics-location") || "unknown",
    });
  };

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const element = target.closest("[data-analytics-event]");
    if (element && !(element instanceof HTMLMediaElement)) captureElement(element);
  });

  document.addEventListener("play", (event) => {
    const target = event.target;
    if (target instanceof Element && target.matches("[data-analytics-event]")) {
      captureElement(target);
    }
  }, true);
}
