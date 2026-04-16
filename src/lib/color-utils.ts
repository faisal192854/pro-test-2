import Color from 'color';

export interface ColorInfo {
  hex: string;
  rgb: string;
  hsl: string;
  name?: string;
}

export function getColorInfo(hex: string): ColorInfo {
  try {
    const c = Color(hex);
    return {
      hex: c.hex().toLowerCase(),
      rgb: c.rgb().string(),
      hsl: c.hsl().round().string(),
    };
  } catch (e) {
    return {
      hex: hex,
      rgb: 'rgb(0, 0, 0)',
      hsl: 'hsl(0, 0%, 0%)',
    };
  }
}

export function extractColorsFromDocument(): {
  backgrounds: string[];
  texts: string[];
  accents: string[];
} {
  const colors = new Set<string>();
  const bgColors = new Set<string>();
  const textColors = new Set<string>();

  const allElements = document.querySelectorAll('*');
  
  allElements.forEach((el) => {
    const style = window.getComputedStyle(el);
    
    const bg = style.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      try {
        bgColors.add(Color(bg).hex().toLowerCase());
      } catch (e) {}
    }

    const text = style.color;
    if (text) {
      try {
        textColors.add(Color(text).hex().toLowerCase());
      } catch (e) {}
    }
  });

  // Simple heuristic for accents: colors that are not grayscale and appear in buttons/links
  const accents = new Set<string>();
  const interactiveElements = document.querySelectorAll('button, a, [role="button"]');
  interactiveElements.forEach((el) => {
    const style = window.getComputedStyle(el);
    const bg = style.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      try {
        const c = Color(bg);
        if (c.saturationl() > 10) {
          accents.add(c.hex().toLowerCase());
        }
      } catch (e) {}
    }
  });

  return {
    backgrounds: Array.from(bgColors).slice(0, 8),
    texts: Array.from(textColors).slice(0, 8),
    accents: Array.from(accents).slice(0, 8),
  };
}

export function generateExport(colors: string[], format: 'css' | 'tailwind' | 'figma'): string {
  if (format === 'css') {
    return `:root {\n${colors
      .map((c, i) => `  --color-${i + 1}: ${c};`)
      .join('\n')}\n}`;
  }
  
  if (format === 'tailwind') {
    const config: Record<string, string> = {};
    colors.forEach((c, i) => {
      config[`color-${i + 1}`] = c;
    });
    return JSON.stringify({ theme: { extend: { colors: config } } }, null, 2);
  }
  
  if (format === 'figma') {
    return JSON.stringify(
      colors.map((c, i) => ({
        name: `Color ${i + 1}`,
        value: c,
        type: 'COLOR',
      })),
      null,
      2
    );
  }
  
  return '';
}
