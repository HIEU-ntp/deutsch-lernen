import type { SVGProps } from 'react'

/** Bộ icon tối giản (stroke 1.75) dùng chung cho điều hướng và nút bấm. */

type IconProps = SVGProps<SVGSVGElement>

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      width={20}
      height={20}
      {...props}
    >
      {children}
    </svg>
  )
}

export const HomeIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </Base>
)

export const BookIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H19v14H5.5A1.5 1.5 0 0 0 4 19.5z" />
    <path d="M4 19.5A1.5 1.5 0 0 1 5.5 18H19v3H5.5A1.5 1.5 0 0 1 4 19.5" />
  </Base>
)

export const RepeatIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8" />
    <path d="M20 4v4h-4" />
    <path d="M20 12a8 8 0 0 1-13.7 5.6L4 16" />
    <path d="M4 20v-4h4" />
  </Base>
)

export const ChartIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 20h16" />
    <path d="M7 20v-6" />
    <path d="M12 20V7" />
    <path d="M17 20v-9" />
  </Base>
)

export const GrammarIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 6h16" />
    <path d="M4 12h10" />
    <path d="M4 18h13" />
    <circle cx="19" cy="12" r="1.6" />
  </Base>
)

export const UserIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="8.5" r="3.75" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </Base>
)

export const SpeakerIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" />
    <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
    <path d="M18 7a7 7 0 0 1 0 10" />
  </Base>
)

export const CheckIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Base>
)

export const CloseIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Base>
)

export const MenuIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Base>
)

export const ArrowRightIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </Base>
)

export const ArrowLeftIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M19 12H5" />
    <path d="m11 18-6-6 6-6" />
  </Base>
)

export const FlameIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 3s5 4.2 5 9a5 5 0 0 1-10 0c0-1.6.6-3 1.5-4 0 1.4.8 2.3 1.7 2.3C11.9 10.3 12 6.5 12 3" />
  </Base>
)

export const SparkIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.8L12 18l-1.7-5.5L4.8 10.7 10.3 9z" />
  </Base>
)

export const CompassIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m15 9-1.8 4.2L9 15l1.8-4.2z" />
  </Base>
)
