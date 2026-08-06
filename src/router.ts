export type Route =
  | { name: "archive" }
  | { name: "capture"; slug: string }
  | { name: "intake" }
  | { name: "history" }
  | { name: "notfound"; path: string };

export function parseHash(hash = window.location.hash): Route {
  const raw = hash.replace(/^#/, "");
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  const cleaned = path === "/" || path === "" ? "/" : path.replace(/\/+$/, "");

  // Legacy Gallery / Collections / Wiki / Stats → Archive
  if (
    cleaned === "/" ||
    cleaned === "/gallery" ||
    cleaned === "/collections" ||
    cleaned === "/wiki" ||
    cleaned === "/stats" ||
    cleaned.startsWith("/collections/") ||
    cleaned.startsWith("/wiki/")
  ) {
    return { name: "archive" };
  }

  if (cleaned === "/intake") return { name: "intake" };
  if (cleaned === "/history") return { name: "history" };
  if (cleaned === "/export") return { name: "archive" };

  const capture = cleaned.match(/^\/capture\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if (capture) return { name: "capture", slug: capture[1]! };

  return { name: "notfound", path: cleaned };
}

export function hrefFor(route: Route): string {
  switch (route.name) {
    case "archive":
      return "#/";
    case "capture":
      return `#/capture/${route.slug}`;
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
