/** Path helpers safe for both Node scripts and browser bundles. */

export function basename(path: string): string {
  const normalized = path.replaceAll("\\", "/");
  const parts = normalized.split("/");
  return parts[parts.length - 1] ?? path;
}

export function extname(path: string): string {
  const base = basename(path);
  const index = base.lastIndexOf(".");
  if (index <= 0) return "";
  return base.slice(index);
}
