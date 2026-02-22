export type RgbColor = {
  r: number;
  g: number;
  b: number;
};

export function hexToRgb(hex: string): RgbColor | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  if (!result) {
    return null;
  }

  const [, r, g, b] = result;
  return {
    r: Number.parseInt(r, 16),
    g: Number.parseInt(g, 16),
    b: Number.parseInt(b, 16)
  };
}

export function isLightColor(hexColor: string): boolean {
  const rgb = hexToRgb(hexColor);

  if (!rgb) {
    return false;
  }

  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 128;
}
