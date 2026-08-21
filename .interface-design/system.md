# Raleigh Lead Recovery Product Interface System

## Direction and feel

Build the product for an owner or operator scanning lead activity between jobs. Product screens should feel like a calm operational ledger: warm, capable, and easy to parse quickly. Keep the public site's personality—warm paper, Avenir, black ink, and lime—but prioritize density and clarity over marketing-scale expression.

The focal question on each screen is: **what needs attention now?** Configuration supports the workflow and should not permanently compete with it.

## Product world

- Domain language: lead queue, campaign, handoff, opportunity, calling window, outcome, recovered pipeline.
- Signature: lime activity cues and slim left rails identify actionable or interested states without coloring the whole interface.
- Avoid generic SaaS card grids, oversized metric tiles, permanently visible settings sidebars, and heavy black framing on everyday work surfaces.

## Palette and tokens

Use the scoped `.product-ui` token system in `app/globals.css`.

- Canvas: `#f7f5ef`
- Surface: `#ffffff`
- Muted surfaces: `#f1efe8` and `#faf9f5`
- Ink: `#151713`
- Muted ink: `#676b61`
- Quiet line: `#d9d8d0`
- Strong line: `#b9bbb2`
- Activity accent: `#d8ff57`
- Warning: `#ffd7cc`

Accent color is scarce. Use lime for one high-priority metric, an active selection, or an actionable lead—not as decoration.

## Depth and shape

- Depth strategy: borders only for daily product surfaces.
- Use quiet 1px dividers; reserve strong black borders for explicit emphasis or destructive confirmation.
- Use shadows only for temporary overlays such as popovers.
- Inputs are inset white surfaces with a 4px radius and a visible focus treatment.
- Avoid thick 2px framing and block shadows in dashboards, tables, and settings.

## Spacing and density

Use a 4px base unit.

- Micro gaps: 4–8px
- Component padding: 12–16px
- Panel padding: 16–20px
- Section gaps: 24–32px
- Everyday controls: 40–44px high with at least a 40px hit area

Group related controls tightly, then use a larger section gap before the next task. Do not give every region the same density.

## Typography and hierarchy

Continue using the existing Avenir family.

- Mono uppercase caption: 8–10px
- Product body: 12–14px
- Panel title: 18–24px
- Page title: 30–36px
- Metric value: 20–24px with tabular numerals

Use weight and text color before adding size. Supporting copy should recede; the current task, queue, or metric should lead.

## Reusable patterns

### Product shell

Scope the product token overrides beneath `.product-ui`. Marketing pages can retain their more expressive framing.

### Workspace-first page

Put working data at full width. Move configuration into a compact, full-width collapsible strip above the workspace. Its closed summary should still show connection state, campaign name, pace, calling window, and eligible count.

### Metric rail

Use shared 1px borders and 14–16px padding. Highlight at most one action-oriented metric with lime.

### Lead workspace

Keep the lead list full width, place search and filters directly above it, render 20 rows per page, and separate rows with subtle dividers. Place row actions on the right at desktop widths and stack them on small screens.

### Customer access panel

Use a white surface with a 4px lime left rail, a compact 40px identity icon, and utility actions aligned to the right.

### Lead upload

Use a white panel and quiet dashed drop zone. Lime marks the upload icon and selected opportunity buckets. Import only selected, callable buckets by default; excluded source rows should remain in the temporary analysis unless the admin intentionally retains them.

### Campaign settings strip

Use a collapsed summary at least 64px high. Expose telephony connection status and an operational summary without opening it. The expanded state must explain the boundary: Mabel controls schedule, pacing, eligibility, and suppression; Vapi places approved calls with the selected customer and lead context.

### Customer agents

Represent each use case as a separate compact `<details>` card inside one customer workspace. The closed state shows job, readiness, and assigned number; the open state owns the greeting, offer, handoff rules, and guardrails. Use a two-column, `items-start` grid at desktop widths and one column on mobile. Customer-specific behavior is configured in Mabel and synchronized to Vapi—the Vapi identifiers remain implementation detail.

### Destructive cleanup

Nest destructive operations under `<details>`, require explicit confirmation, and state the exact scope. Full-list deletion uses destructive red. Removing excluded imports is neutral because it preserves the qualified audience and suppression list.

## Responsive behavior

- Stack filters and row actions by 390px.
- Prevent horizontal overflow in operational screens.
- Keep primary actions at least 40px tall.
- Preserve the workflow order: status, task, controls, then supporting detail.
