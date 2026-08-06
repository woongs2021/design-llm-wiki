/**
 * Declared contrast pairs for WCAG checks.
 * Criterion is assigned per pair — never inferred from token names alone.
 * body = 4.5:1, large = 3:1 (18pt+/14pt bold), ui = 3:1 (non-text UI).
 *
 * mode: "any" uses theme tokens (mode-independent surfaces).
 * mode: "light" | "dark" resolves --bg/--fg/--fg-muted/--stroke/--focus-ring.
 */
export type ContrastCriterion = "body" | "large" | "ui";
export type ContrastMode = "any" | "light" | "dark";

export type ContrastPair = {
  id: string;
  foreground: string;
  background: string;
  criterion: ContrastCriterion;
  mode: ContrastMode;
  note: string;
};

export const CONTRAST_THRESHOLDS: Record<ContrastCriterion, number> = {
  body: 4.5,
  large: 3,
  ui: 3,
};

export const CONTRAST_PAIRS: ContrastPair[] = [
  {
    id: "fg-on-bg-light",
    foreground: "--fg",
    background: "--bg",
    criterion: "body",
    mode: "light",
    note: "Canvas body text in light mode",
  },
  {
    id: "fg-on-bg-dark",
    foreground: "--fg",
    background: "--bg",
    criterion: "body",
    mode: "dark",
    note: "Canvas body text in dark mode",
  },
  {
    id: "fg-muted-on-bg-light",
    foreground: "--fg-muted",
    background: "--bg",
    criterion: "body",
    mode: "light",
    note: "Muted caption/meta on canvas (light)",
  },
  {
    id: "fg-muted-on-bg-dark",
    foreground: "--fg-muted",
    background: "--bg",
    criterion: "body",
    mode: "dark",
    note: "Muted caption/meta on canvas (dark)",
  },
  {
    id: "on-primary-on-primary",
    foreground: "--on-primary",
    background: "--primary",
    criterion: "large",
    mode: "any",
    note: "Primary CTA label / large type on primary block",
  },
  {
    id: "on-soft-on-soft",
    foreground: "--on-soft",
    background: "--soft",
    criterion: "body",
    mode: "any",
    note: "Soft surface body ink — mode-independent, not --fg",
  },
  {
    id: "on-tint-on-tint",
    foreground: "--on-tint",
    background: "--tint",
    criterion: "body",
    mode: "any",
    note: "Tint surface body ink — mode-independent, not --fg",
  },
  {
    id: "on-deep-on-deep",
    foreground: "--on-deep",
    background: "--deep",
    criterion: "body",
    mode: "any",
    note: "Deep surface body ink",
  },
  {
    id: "on-mid-on-mid",
    foreground: "--on-mid",
    background: "--mid",
    criterion: "large",
    mode: "any",
    note: "Mid surface large type / UI label",
  },
  {
    id: "on-warning-on-warning",
    foreground: "--on-warning",
    background: "--warning",
    criterion: "large",
    mode: "any",
    note: "Warning badge label",
  },
  {
    id: "primary-on-bg-light-ui",
    foreground: "--primary",
    background: "--bg",
    criterion: "ui",
    mode: "light",
    note: "Primary as non-text UI against light canvas",
  },
  {
    id: "focus-ring-on-bg-light-ui",
    foreground: "--focus-ring",
    background: "--bg",
    criterion: "ui",
    mode: "light",
    note: "Focus ring against light canvas",
  },
  {
    id: "focus-ring-on-bg-dark-ui",
    foreground: "--focus-ring",
    background: "--bg",
    criterion: "ui",
    mode: "dark",
    note: "Focus ring against dark canvas",
  },
  {
    id: "stroke-on-bg-light-ui",
    foreground: "--stroke",
    background: "--bg",
    criterion: "ui",
    mode: "light",
    note: "Interactive/card hairline against light canvas",
  },
  {
    id: "stroke-on-bg-dark-ui",
    foreground: "--stroke",
    background: "--bg",
    criterion: "ui",
    mode: "dark",
    note: "Interactive/card hairline against dark canvas",
  },
  {
    id: "primary-on-tint-ui",
    foreground: "--primary",
    background: "--tint",
    criterion: "ui",
    mode: "any",
    note: "Stats bar fill on tint track",
  },
  {
    id: "on-soft-on-soft-large",
    foreground: "--on-soft",
    background: "--soft",
    criterion: "large",
    mode: "any",
    note: "Large numbers on soft stat tiles / empty states",
  },
  {
    id: "on-deep-on-deep-large",
    foreground: "--on-deep",
    background: "--deep",
    criterion: "large",
    mode: "any",
    note: "Large numbers / mono preview on deep surfaces",
  },
  {
    id: "on-tint-on-tint-large",
    foreground: "--on-tint",
    background: "--tint",
    criterion: "large",
    mode: "any",
    note: "Large headings on tint empty-state panels",
  },
  {
    id: "mid-on-bg-light",
    foreground: "--mid",
    background: "--bg",
    criterion: "body",
    mode: "light",
    note: "Link text (mid) on light canvas",
  },
  {
    id: "soft-on-bg-dark",
    foreground: "--soft",
    background: "--bg",
    criterion: "body",
    mode: "dark",
    note: "Link text (soft) on dark canvas",
  },
];
