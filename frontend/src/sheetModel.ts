export type SheetSize = 'collapsed' | 'half' | 'expanded';
export type SheetMode = 'list' | 'state';
export function resolveSheetSize(size: SheetSize, mode: SheetMode): SheetSize {
  return mode === 'state' && size === 'expanded' ? 'half' : size;
}
export function sheetStops(mode: SheetMode, height: number) {
  return mode === 'state'
    ? [
        { size: 'collapsed' as const, height: 48 },
        {
          size: 'half' as const,
          height: Math.max(48, Math.min(400, height - 158)),
        },
      ]
    : [
        { size: 'collapsed' as const, height: 120 },
        { size: 'half' as const, height: Math.max(120, height / 2 - 11) },
        { size: 'expanded' as const, height: Math.max(120, height - 157) },
      ];
}
export function nextSheetSize(size: SheetSize, mode: SheetMode): SheetSize {
  const stops = sheetStops(mode, 844);
  const index = stops.findIndex(
    (stop) => stop.size === resolveSheetSize(size, mode),
  );
  return stops[(index + 1) % stops.length].size;
}
export function nearestSheetSize(
  height: number,
  mode: SheetMode,
  containerHeight: number,
): SheetSize {
  return sheetStops(mode, containerHeight).reduce((best, stop) =>
    Math.abs(stop.height - height) < Math.abs(best.height - height)
      ? stop
      : best,
  ).size;
}
