import type { ReactNode } from 'react';

type IconProps = { color?: string; className?: string };

const base = (children: ReactNode, { color = 'currentColor', className }: IconProps) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    shapeRendering="crispEdges"
    aria-hidden
  >
    <g fill={color}>{children}</g>
  </svg>
);

export function IconFolder(p: IconProps = {}) {
  return base(
    <>
      <rect x="3" y="7" width="18" height="13" />
      <rect x="3" y="5" width="8" height="3" fill="var(--or)" />
    </>,
    p,
  );
}

export function IconCrop(p: IconProps = {}) {
  return base(
    <>
      <rect x="6" y="6" width="2" height="12" />
      <rect x="6" y="16" width="12" height="2" />
      <rect x="16" y="6" width="2" height="12" />
      <rect x="6" y="6" width="12" height="2" />
      <rect x="4" y="4" width="4" height="4" fill="var(--cyan)" />
      <rect x="16" y="16" width="4" height="4" fill="var(--cyan)" />
    </>,
    p,
  );
}

export function IconScissors(p: IconProps = {}) {
  return base(
    <>
      <rect x="5" y="4" width="3" height="3" />
      <rect x="16" y="4" width="3" height="3" />
      <rect x="7" y="7" width="2" height="5" />
      <rect x="15" y="7" width="2" height="5" />
      <rect x="9" y="12" width="6" height="2" />
      <rect x="10" y="14" width="2" height="6" />
      <rect x="12" y="14" width="2" height="6" />
    </>,
    p,
  );
}

export function IconMute(p: IconProps = {}) {
  return base(
    <>
      <rect x="3" y="9" width="4" height="6" />
      <rect x="7" y="7" width="3" height="10" />
      <rect x="10" y="5" width="3" height="14" />
      <rect x="15" y="7" width="2" height="2" fill="var(--rouge)" />
      <rect x="17" y="9" width="2" height="2" fill="var(--rouge)" />
      <rect x="15" y="11" width="2" height="2" fill="var(--rouge)" />
      <rect x="17" y="13" width="2" height="2" fill="var(--rouge)" />
      <rect x="15" y="15" width="2" height="2" fill="var(--rouge)" />
    </>,
    p,
  );
}

export function IconWave(p: IconProps = {}) {
  return base(
    <>
      <rect x="3" y="10" width="2" height="4" fill="var(--or)" />
      <rect x="6" y="6" width="2" height="12" fill="var(--or)" />
      <rect x="9" y="8" width="2" height="8" fill="var(--or)" />
      <rect x="12" y="4" width="2" height="16" fill="var(--or)" />
      <rect x="15" y="7" width="2" height="10" fill="var(--or)" />
      <rect x="18" y="9" width="2" height="6" fill="var(--or)" />
    </>,
    p,
  );
}

export function IconText(p: IconProps = {}) {
  return base(
    <>
      <rect x="5" y="5" width="14" height="3" />
      <rect x="11" y="5" width="2" height="14" />
    </>,
    p,
  );
}

export function IconImage(p: IconProps = {}) {
  return base(
    <>
      <rect x="3" y="5" width="18" height="14" />
      <rect x="5" y="7" width="14" height="10" fill="var(--puits)" />
      <rect x="6" y="8" width="3" height="3" fill="var(--or)" />
      <rect x="7" y="14" width="10" height="2" fill="var(--cyan)" />
      <rect x="12" y="11" width="5" height="3" fill="var(--vert-phosphor)" />
    </>,
    p,
  );
}

export function IconPlay(p: IconProps = {}) {
  return base(
    <>
      <rect x="8" y="5" width="2" height="14" fill="var(--vert-phosphor)" />
      <rect x="10" y="6" width="2" height="12" fill="var(--vert-phosphor)" />
      <rect x="12" y="7" width="2" height="10" fill="var(--vert-phosphor)" />
      <rect x="14" y="8" width="2" height="8" fill="var(--vert-phosphor)" />
      <rect x="16" y="9" width="2" height="6" fill="var(--vert-phosphor)" />
    </>,
    p,
  );
}

export function IconPause(p: IconProps = {}) {
  return base(
    <>
      <rect x="7" y="5" width="4" height="14" fill="var(--vert-phosphor)" />
      <rect x="13" y="5" width="4" height="14" fill="var(--vert-phosphor)" />
    </>,
    p,
  );
}

export function IconStop(p: IconProps = {}) {
  return base(<rect x="7" y="7" width="10" height="10" />, p);
}

export function IconLoop(p: IconProps = {}) {
  return base(
    <>
      <rect x="5" y="7" width="12" height="2" />
      <rect x="15" y="7" width="2" height="8" />
      <rect x="7" y="15" width="12" height="2" />
      <rect x="7" y="9" width="2" height="8" />
      <rect x="15" y="5" width="4" height="2" fill="var(--or)" />
      <rect x="5" y="17" width="4" height="2" fill="var(--or)" />
    </>,
    p,
  );
}

export function IconZoomIn(p: IconProps = {}) {
  return base(
    <>
      <rect x="5" y="5" width="10" height="10" />
      <rect x="7" y="7" width="6" height="6" fill="var(--puits)" />
      <rect x="9" y="8" width="2" height="4" fill="var(--parchemin)" />
      <rect x="8" y="9" width="4" height="2" fill="var(--parchemin)" />
      <rect x="14" y="14" width="5" height="2" transform="rotate(45 14 14)" />
      <rect x="15" y="15" width="6" height="2" />
    </>,
    p,
  );
}

export function IconZoomOut(p: IconProps = {}) {
  return base(
    <>
      <rect x="5" y="5" width="10" height="10" />
      <rect x="7" y="7" width="6" height="6" fill="var(--puits)" />
      <rect x="8" y="9" width="4" height="2" fill="var(--parchemin)" />
      <rect x="15" y="15" width="6" height="2" />
    </>,
    p,
  );
}

export function IconGear(p: IconProps = {}) {
  return base(
    <>
      <rect x="10" y="3" width="4" height="3" />
      <rect x="10" y="18" width="4" height="3" />
      <rect x="3" y="10" width="3" height="4" />
      <rect x="18" y="10" width="3" height="4" />
      <rect x="5" y="5" width="3" height="3" />
      <rect x="16" y="5" width="3" height="3" />
      <rect x="5" y="16" width="3" height="3" />
      <rect x="16" y="16" width="3" height="3" />
      <rect x="8" y="8" width="8" height="8" />
      <rect x="10" y="10" width="4" height="4" fill="var(--puits)" />
    </>,
    p,
  );
}

export function IconNote(p: IconProps = {}) {
  return base(
    <>
      <rect x="14" y="4" width="3" height="12" fill="var(--or)" />
      <rect x="8" y="12" width="9" height="3" fill="var(--or)" />
      <rect x="6" y="13" width="5" height="5" fill="var(--or)" />
      <rect x="14" y="4" width="6" height="3" fill="var(--or)" />
    </>,
    p,
  );
}

export function IconClapper(p: IconProps = {}) {
  return base(
    <>
      <rect x="3" y="8" width="18" height="11" fill="var(--rose-pixel)" />
      <rect x="3" y="5" width="18" height="4" />
      <rect x="5" y="5" width="3" height="4" fill="var(--parchemin)" />
      <rect x="11" y="5" width="3" height="4" fill="var(--parchemin)" />
      <rect x="17" y="5" width="2" height="4" fill="var(--parchemin)" />
    </>,
    p,
  );
}

export function IconBrush(p: IconProps = {}) {
  return base(
    <>
      <rect x="14" y="3" width="4" height="10" fill="var(--violet-magie)" />
      <rect x="10" y="11" width="8" height="4" />
      <rect x="8" y="15" width="6" height="5" fill="var(--bronze)" />
    </>,
    p,
  );
}

export function IconKey(p: IconProps = {}) {
  return base(
    <>
      <rect x="4" y="8" width="8" height="8" />
      <rect x="6" y="10" width="4" height="4" fill="var(--puits)" />
      <rect x="12" y="10" width="8" height="3" />
      <rect x="17" y="13" width="2" height="4" />
      <rect x="14" y="13" width="2" height="3" />
    </>,
    p,
  );
}

export function IconDoc(p: IconProps = {}) {
  return base(
    <>
      <rect x="6" y="3" width="12" height="18" />
      <rect x="8" y="5" width="8" height="2" fill="var(--puits)" />
      <rect x="8" y="9" width="8" height="2" fill="var(--puits)" />
      <rect x="8" y="13" width="6" height="2" fill="var(--puits)" />
    </>,
    p,
  );
}

export function IconCheck(p: IconProps = {}) {
  return base(
    <>
      <rect x="5" y="12" width="3" height="3" fill="var(--vert-phosphor)" />
      <rect x="8" y="14" width="3" height="3" fill="var(--vert-phosphor)" />
      <rect x="11" y="11" width="3" height="3" fill="var(--vert-phosphor)" />
      <rect x="14" y="8" width="3" height="3" fill="var(--vert-phosphor)" />
      <rect x="17" y="5" width="3" height="3" fill="var(--vert-phosphor)" />
    </>,
    p,
  );
}

export function LogoMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden>
      <rect width="16" height="16" fill="#FF5A7A" />
      {/* Monogramme X */}
      <rect x="3" y="3" width="2" height="2" fill="#FFF8EE" />
      <rect x="5" y="5" width="2" height="2" fill="#FFF8EE" />
      <rect x="7" y="7" width="2" height="2" fill="#FFF8EE" />
      <rect x="9" y="9" width="2" height="2" fill="#FFF8EE" />
      <rect x="11" y="11" width="2" height="2" fill="#FFF8EE" />
      <rect x="11" y="3" width="2" height="2" fill="#FFF8EE" />
      <rect x="9" y="5" width="2" height="2" fill="#FFF8EE" />
      <rect x="5" y="9" width="2" height="2" fill="#FFF8EE" />
      <rect x="3" y="11" width="2" height="2" fill="#FFF8EE" />
    </svg>
  );
}
