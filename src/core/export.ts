export function exportCanvas(canvas: Pick<HTMLCanvasElement, 'width' | 'height' | 'toDataURL'>, format: 'image/png' | 'image/jpeg' = 'image/png'): string {
  if (canvas.width <= 0 || canvas.height <= 0) throw new Error('Canvas must have a positive size');
  return canvas.toDataURL(format);
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename = 'generative-art.png'): void {
  const anchor = document.createElement('a');
  anchor.download = filename;
  anchor.href = exportCanvas(canvas);
  anchor.click();
}
