import Color from "colorjs.io";

export type OklchColor = {
  l: number;
  c: number;
  h: number | null;
};

export type MappedHexColor = {
  hex: string;
  oklch: OklchColor;
  clipped: boolean;
};

export type ColorFormatId = "hex" | "rgb" | "hsl" | "oklch" | "oklab" | "lab" | "lch" | "p3";

export const COLOR_FORMAT_IDS: ColorFormatId[] = ["hex", "rgb", "hsl", "oklch", "oklab", "lab", "lch", "p3"];

export const COLOR_FORMAT_LABELS: Record<ColorFormatId, string> = {
  hex: "HEX",
  rgb: "RGB",
  hsl: "HSL",
  oklch: "OKLCH",
  oklab: "OKLab",
  lab: "Lab",
  lch: "LCH",
  p3: "Display-P3"
};

const MIN_LIGHTNESS = 0;
const MAX_LIGHTNESS = 1;
const DEFAULT_HUE = 0;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeHue(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function normalizeHex(hex: string): string {
  const normalized = hex.trim().toLowerCase();
  return normalized.startsWith("#") ? normalized : `#${normalized}`;
}

function sanitizeHue(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_HUE;
  }

  return normalizeHue(value);
}

function sanitizeLightness(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return MIN_LIGHTNESS;
  }

  return clamp(value, MIN_LIGHTNESS, MAX_LIGHTNESS);
}

function sanitizeChroma(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    return 0;
  }

  return value;
}

export function parseHexToOklch(hex: string): OklchColor | null {
  try {
    const color = new Color(hex).to("oklch");
    const [l, c, h] = color.coords;

    return {
      l: sanitizeLightness(l),
      c: sanitizeChroma(c),
      h: typeof h === "number" && !Number.isNaN(h) ? normalizeHue(h) : null
    };
  } catch {
    return null;
  }
}

function createOklchColor(color: OklchColor): Color {
  return new Color("oklch", [sanitizeLightness(color.l), sanitizeChroma(color.c), sanitizeHue(color.h)]);
}

function toSerializableOklch(color: Color): OklchColor {
  const converted = color.to("oklch");
  const [l, c, h] = converted.coords;

  return {
    l: sanitizeLightness(l),
    c: sanitizeChroma(c),
    h: typeof h === "number" && !Number.isNaN(h) ? normalizeHue(h) : null
  };
}

export function mapOklchToHex(color: OklchColor): MappedHexColor {
  const sourceColor = createOklchColor(color);
  const clipped = !sourceColor.inGamut("srgb");
  const mappedColor = clipped ? sourceColor.clone().toGamut({ space: "srgb", method: "css" }) : sourceColor;
  const hex = mappedColor.to("srgb").toString({ format: "hex" });

  return {
    hex: normalizeHex(hex),
    oklch: toSerializableOklch(mappedColor),
    clipped
  };
}

export function formatOklchForDisplay(color: OklchColor): string {
  const lightness = (sanitizeLightness(color.l) * 100).toFixed(1);
  const chroma = sanitizeChroma(color.c).toFixed(4);
  const hue = color.h === null ? "none" : normalizeHue(color.h).toFixed(1);

  return `oklch(${lightness}% ${chroma} ${hue})`;
}

function formatAsRgbString(color: Color): string {
  const [r, g, b] = color.to("srgb").coords;
  const red = Math.round(clamp(typeof r === "number" ? r : 0, 0, 1) * 255);
  const green = Math.round(clamp(typeof g === "number" ? g : 0, 0, 1) * 255);
  const blue = Math.round(clamp(typeof b === "number" ? b : 0, 0, 1) * 255);

  return `rgb(${red}, ${green}, ${blue})`;
}

function formatAsHslString(color: Color): string {
  const [h, s, l] = color.to("hsl").coords;
  const hue = normalizeHue(typeof h === "number" ? h : 0).toFixed(1);
  const saturation = (clamp(typeof s === "number" ? s : 0, 0, 1) * 100).toFixed(1);
  const lightness = (clamp(typeof l === "number" ? l : 0, 0, 1) * 100).toFixed(1);

  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

export function formatHexAsType(hex: string, format: ColorFormatId): string {
  const color = new Color(hex);

  switch (format) {
    case "hex":
      return normalizeHex(color.to("srgb").toString({ format: "hex" }));
    case "rgb":
      return formatAsRgbString(color);
    case "hsl":
      return formatAsHslString(color);
    case "oklch":
      return color.to("oklch").toString({ precision: 4 });
    case "oklab":
      return color.to("oklab").toString({ precision: 4 });
    case "lab":
      return color.to("lab").toString({ precision: 3 });
    case "lch":
      return color.to("lch").toString({ precision: 3 });
    case "p3":
      return color.to("p3").toString({ precision: 4 });
    default:
      return normalizeHex(hex);
  }
}

export function getHexFormats(hex: string): Record<ColorFormatId, string> {
  return {
    hex: formatHexAsType(hex, "hex"),
    rgb: formatHexAsType(hex, "rgb"),
    hsl: formatHexAsType(hex, "hsl"),
    oklch: formatHexAsType(hex, "oklch"),
    oklab: formatHexAsType(hex, "oklab"),
    lab: formatHexAsType(hex, "lab"),
    lch: formatHexAsType(hex, "lch"),
    p3: formatHexAsType(hex, "p3")
  };
}
