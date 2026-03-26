/**
 * Jednoduché technické ikony (SVG) – barva přes currentColor.
 */
import type { ReactNode } from 'react';

type IconProps = { className?: string; size?: number; title?: string };

function wrap(children: ReactNode, { className, size = 22, title }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function IconStation(props: IconProps) {
  return wrap(
    <>
      <path
        d="M4 7h16v10H4V7zm2 2v6h12V9H6zm2 2h2v2H8v-2zm4 0h2v2h-2v-2z"
        fill="currentColor"
        opacity="0.9"
      />
      <path d="M12 4v3M9 5.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>,
    props
  );
}

export function IconTask(props: IconProps) {
  return wrap(
    <>
      <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 9h8M8 12h5M8 15h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>,
    props
  );
}

export function IconPhoto(props: IconProps) {
  return wrap(
    <>
      <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="9" cy="11" r="1.5" fill="currentColor" />
      <path d="M4 16l4-4 3 3 4-5 5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </>,
    props
  );
}

export function IconCheck(props: IconProps) {
  return wrap(
    <path
      d="M6 12l4 4 8-8"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />,
    props
  );
}

export function IconSend(props: IconProps) {
  return wrap(
    <path
      d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />,
    props
  );
}

export function IconSave(props: IconProps) {
  return wrap(
    <>
      <path
        d="M6 4h9l3 3v13H6V4z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M8 4v4h6V4M8 20v-6h8v6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </>,
    props
  );
}

export function IconChevronRight(props: IconProps) {
  return wrap(
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    props
  );
}

export function IconQr(props: IconProps) {
  return wrap(
    <>
      <path
        d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 10h6v-6h-6v6z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M16 14v6M14 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>,
    props
  );
}

export function IconMenu(props: IconProps) {
  return wrap(
    <>
      <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </>,
    props
  );
}

export function IconBolt(props: IconProps) {
  return wrap(
    <path
      d="M13 2L4 14h7l-1 8 10-14h-7l0-6z"
      fill="currentColor"
      opacity="0.95"
    />,
    props
  );
}
