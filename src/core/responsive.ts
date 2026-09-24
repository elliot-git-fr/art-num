export type LayoutMode = 'large-desktop' | 'desktop' | 'tablet-landscape' | 'tablet-portrait' | 'mobile-landscape' | 'mobile-portrait';

export function layoutMode(width: number, height: number): LayoutMode {
  if (width >= 1920) return 'large-desktop';
  if (width >= 1100) return 'desktop';
  if (height < 500 && width < 960) return 'mobile-landscape';
  if (width >= 700) return width >= height ? 'tablet-landscape' : 'tablet-portrait';
  return width >= height ? 'mobile-landscape' : 'mobile-portrait';
}

export interface CanvasSize {
  cssWidth: number;
  cssHeight: number;
  pixelWidth: number;
  pixelHeight: number;
  pixelRatio: number;
}

export function calculateCanvasSize(width: number, height: number, deviceRatio: number, maximumRatio = 2): CanvasSize {
  const cssWidth = Number.isFinite(width) && width > 0 ? Math.max(1, Math.round(width)) : 1;
  const cssHeight = Number.isFinite(height) && height > 0 ? Math.max(1, Math.round(height)) : 1;
  const pixelRatio = Number.isFinite(deviceRatio) && deviceRatio > 0 ? Math.min(deviceRatio, maximumRatio) : 1;
  return { cssWidth, cssHeight, pixelWidth: Math.max(1, Math.round(cssWidth * pixelRatio)), pixelHeight: Math.max(1, Math.round(cssHeight * pixelRatio)), pixelRatio };
}
