export type Route =
  | { name: "archive" }
  | { name: "capture"; slug: string }
  | { name: "stats" }
  | { name: "designSystem" }
  | { name: "intake" }
  | { name: "history" }
  | { name: "notfound"; path: string };

const SLUG = "[a-z0-9]+(?:-[a-z0-9]+)*";

export function parseHash(hash = window.location.hash): Route {
  const raw = hash.replace(/^#/, "");
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  const cleaned = path === "/" || path === "" ? "/" : path.replace(/\/+$/, "");

  if (cleaned === "/" || cleaned === "/gallery") return { name: "archive" };
  if (cleaned === "/stats") return { name: "stats" };
  if (cleaned === "/design-system") return { name: "designSystem" };
  if (cleaned === "/intake") return { name: "intake" };
  if (cleaned === "/history") return { name: "history" };

  const capture = cleaned.match(new RegExp(`^/capture/(${SLUG})$`));
  if (capture) return { name: "capture", slug: capture[1]! };

  return { name: "notfound", path: cleaned };
}

export function hrefFor(route: Route): string {
  switch (route.name) {
    case "archive":
      return "#/";
    case "capture":
      return `#/capture/${route.slug}`;
    case "stats":
      return "#/stats";
    case "designSystem":
      return "#/design-system";
    case "intake":
      return "#/intake";
    case "history":
      return "#/history";
    case "notfound":
      return `#${route.path}`;
  }
}

export function onRouteChange(handler: (route: Route) => void): () => void {
  const listener = () => handler(parseHash());
  window.addEventListener("hashchange", listener);
  handler(parseHash());
  return () => window.removeEventListener("hashchange", listener);
}
