import type { CSSProperties } from 'react';
import { figmaIcons, type FigmaIconName } from '../figmaIcons';
export function FigmaIcon({
  name,
  size,
  original = false,
  className = '',
  style,
}: {
  name: FigmaIconName;
  size?: number;
  original?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const asset = figmaIcons[name];
  const width = size ?? asset.width;
  const height = (width * asset.height) / asset.width;
  const url = encodeURI(asset.url);
  const shared = { width, height, ...style };
  if (original)
    return (
      <img
        className={`figma-icon ${className}`}
        src={url}
        width={width}
        height={height}
        style={shared}
        alt=""
        draggable={false}
        aria-hidden="true"
      />
    );
  return (
    <span
      className={`figma-icon figma-icon--mask ${className}`}
      style={{
        ...shared,
        maskImage: `url("${url}")`,
        WebkitMaskImage: `url("${url}")`,
      }}
      aria-hidden="true"
    />
  );
}
