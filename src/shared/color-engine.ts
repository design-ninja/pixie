import Color from "colorjs.io";

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
