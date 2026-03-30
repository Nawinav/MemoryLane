type IconProps = {
  className?: string;
};

function SvgIcon({
  children,
  className,
  viewBox = "0 0 24 24"
}: IconProps & { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox={viewBox}
    >
      {children}
    </svg>
  );
}

export function HeartIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M12 20.5s-6.5-4.5-8.7-8C1.6 9.7 2 6.4 4.8 5a4.8 4.8 0 0 1 5.4.8L12 7.5l1.8-1.7A4.8 4.8 0 0 1 19.2 5c2.8 1.4 3.2 4.7 1.5 7.5-2.2 3.5-8.7 8-8.7 8Z" />
    </SvgIcon>
  );
}

export function CameraIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M4.5 7.5h3l1.6-2h5.8l1.6 2h3A1.5 1.5 0 0 1 21 9v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V9a1.5 1.5 0 0 1 1.5-1.5Z" />
      <circle cx="12" cy="13" r="3.5" />
    </SvgIcon>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <rect height="15" rx="2.5" width="17" x="3.5" y="5.5" />
      <path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17" />
    </SvgIcon>
  );
}

export function MapPinIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M12 20s5.5-5.6 5.5-10A5.5 5.5 0 1 0 6.5 10c0 4.4 5.5 10 5.5 10Z" />
      <circle cx="12" cy="10" r="2.2" />
    </SvgIcon>
  );
}

export function SparklesIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="m12 3 1.1 3.3L16.5 7l-3.4.8L12 11l-1.1-3.2L7.5 7l3.4-.7L12 3ZM6 13l.7 2.1L9 16l-2.3.8L6 19l-.7-2.2L3 16l2.3-.9L6 13Zm12 1 .8 2.4L21 17l-2.2.6L18 20l-.8-2.4L15 17l2.2-.6L18 14Z" />
    </SvgIcon>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <rect height="11" rx="2.5" width="13" x="5.5" y="10" />
      <path d="M8 10V8a4 4 0 1 1 8 0v2" />
    </SvgIcon>
  );
}

export function FolderHeartIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M3.5 7.5h5l2 2h10v8.8A1.7 1.7 0 0 1 18.8 20H5.2A1.7 1.7 0 0 1 3.5 18.3V7.5Z" />
      <path d="M12 16.7s-2.8-2-3.7-3.4c-.8-1.2-.5-2.8.8-3.4 1-.5 2.3-.1 2.9.7.6-.8 1.9-1.2 2.9-.7 1.3.6 1.6 2.2.8 3.4-.9 1.4-3.7 3.4-3.7 3.4Z" />
    </SvgIcon>
  );
}
