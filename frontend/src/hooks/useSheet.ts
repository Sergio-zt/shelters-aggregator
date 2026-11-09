import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import {
  nextSheetSize,
  nearestSheetSize,
  resolveSheetSize,
  sheetStops,
  type SheetMode,
  type SheetSize,
} from '../sheetModel';
export type { SheetSize } from '../sheetModel';
export function useSheet(onResize?: () => void, mode: SheetMode = 'list') {
  const [storedSize, setSize] = useState<SheetSize>('half');
  const size = resolveSheetSize(storedSize, mode);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const gesture = useRef<{
    pointerId: number;
    y: number;
    height: number;
    min: number;
    max: number;
    containerHeight: number;
  } | null>(null);
  const dragged = useRef(false);
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !event.isPrimary) return;
    const sheet = event.currentTarget.closest<HTMLElement>('.list-sheet');
    if (!sheet?.parentElement) return;
    const containerHeight = sheet.parentElement.clientHeight;
    const stops = sheetStops(mode, containerHeight);
    gesture.current = {
      pointerId: event.pointerId,
      y: event.clientY,
      height:
        mode === 'state' && size === 'collapsed'
          ? 48
          : sheet.getBoundingClientRect().height,
      min: stops[0].height,
      max: stops[stops.length - 1].height,
      containerHeight,
    };
    dragged.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const start = gesture.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const delta = start.y - event.clientY;
    if (Math.abs(delta) < 4 && !dragged.current) return;
    if (!dragged.current) onResize?.();
    dragged.current = true;
    setDragHeight(
      Math.max(start.min, Math.min(start.max, start.height + delta)),
    );
  };
  const finish = (
    event: PointerEvent<HTMLButtonElement>,
    cancelled = false,
  ) => {
    const start = gesture.current;
    if (!start || start.pointerId !== event.pointerId) return;
    if (dragged.current && !cancelled) {
      setSize(
        nearestSheetSize(
          start.height + start.y - event.clientY,
          mode,
          start.containerHeight,
        ),
      );
    }
    gesture.current = null;
    setDragHeight(null);
  };
  const cycle = () => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    onResize?.();
    setSize((current) => nextSheetSize(current, mode));
  };
  return {
    size,
    setSize,
    dragHeight,
    sheetProps: {
      'data-sheet-mode': mode,
      'data-dragging': dragHeight !== null || undefined,
      style:
        dragHeight === null
          ? undefined
          : ({ '--sheet-drag-height': `${dragHeight}px` } as CSSProperties),
    },
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: PointerEvent<HTMLButtonElement>) => finish(event),
      onPointerCancel: (event: PointerEvent<HTMLButtonElement>) =>
        finish(event, true),
      onLostPointerCapture: () => {
        gesture.current = null;
        setDragHeight(null);
      },
      onClick: cycle,
    },
  };
}
