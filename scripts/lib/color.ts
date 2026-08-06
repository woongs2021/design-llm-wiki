export type Rgb = { r: number; g: number; b: number; a: number };

export function parseCssColor(value: string): Rgb {
  const trimmed = value.trim().toLowerCase();

  const hex = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) {
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    }
    if (h.length === 6) h += "ff";
    return {
      r: Number.parseInt(h.slice(0, 2), 16),
      g: Number.parseInt(h.slice(2, 4), 16),
      b: Number.parseInt(h.slice(4, 6), 16),
      a: Number.parseInt(h.slice(6, 8), 16) / 255,
    };
  }

  const rgba = trimmed.match(
    /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)$/,
  );
  if (rgba) {
    return {
      r: Number(rgba[1]),
      g: Number(rgba[2]),
      b: Number(rgba[3]),
      a: rgba[4] === undefined ? 1 : Number(rgba[4]),
    };
  }

  throw new Error(`Unsupported color value: ${value}`);
}

export function compositeOver(fg: Rgb, bg: Rgb): Rgb {
  const a = fg.a + bg.a * (1 - fg.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  return {
    r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
    g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
    b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
    a,
  };
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(rgb: Rgb): number {
  return (
    0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b)
  );
}

export function contrastRatio(fg: Rgb, bg: Rgb): number {
  const solidBg = { ...bg, a: 1 };
  const composed = compositeOver(fg, solidBg);
  const l1 = relativeLuminance(composed);
  const l2 = relativeLuminance(solidBg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
