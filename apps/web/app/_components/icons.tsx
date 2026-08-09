import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const defaults = {
  "aria-hidden": true,
  fill: "none",
  height: 16,
  viewBox: "0 0 16 16",
  width: 16,
} as const;

export function ArrowIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path
        d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BagIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path
        d="M3.25 5.75h9.5l-.55 7H3.8l-.55-7Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path d="M6 6V4.5a2 2 0 0 1 4 0V6" stroke="currentColor" />
    </svg>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path
        d="M2.5 3.25h11v8h-6l-3.25 2v-2H2.5v-8Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path d="M5 6h6M5 8.5h4" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path
        d="m3.5 8 3 3 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path
        d="m6 4 4 4-4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path
        d="m4 4 8 8M12 4l-8 8"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M3.5 8h9" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path
        d="m2.5 3 11 5-11 5 1.2-4.1L9 8 3.7 7.1 2.5 3Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="8" cy="5" r="2.25" stroke="currentColor" />
      <path
        d="M3.5 13c.35-2.45 1.85-3.75 4.5-3.75s4.15 1.3 4.5 3.75"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
}
