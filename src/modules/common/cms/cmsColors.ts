const directions = {
  'left-right': [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }],
  'right-left': [{ x: 1, y: 0.5 }, { x: 0, y: 0.5 }],
  'top-bottom': [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }],
  'bottom-top': [{ x: 0.5, y: 1 }, { x: 0.5, y: 0 }],
  'top-left-bottom-right': [{ x: 0, y: 0 }, { x: 1, y: 1 }],
  'bottom-left-top-right': [{ x: 0, y: 1 }, { x: 1, y: 0 }],
} as const;

const hexColor = /^#[0-9a-f]{6}$/i;

export function parseCmsBackground(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return null;
  if (hexColor.test(raw)) return { color: raw };

  try {
    const { type, colors, direction } = JSON.parse(raw);
    if (type !== 'gradient' || !Array.isArray(colors) || colors.length < 2 ||
        !colors.every(color => typeof color === 'string' && hexColor.test(color)) ||
        !Object.prototype.hasOwnProperty.call(directions, direction)) return null;

    const [start, end] = directions[direction as keyof typeof directions];
    return { color: colors[0] as string, gradient: { colors: colors as string[], start, end } };
  } catch {
    return null;
  }
}
