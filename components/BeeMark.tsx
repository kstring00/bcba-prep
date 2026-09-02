type BeeMarkProps = {
  size?: number;
  className?: string;
};

export function BeeMark({ size = 34, className }: BeeMarkProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M21.5 17.8c-3.7-6.5-9.7-8.8-13.2-5.7-3.4 3-1.4 9.1 5.8 12.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M26.5 17.8c3.7-6.5 9.7-8.8 13.2-5.7 3.4 3 1.4 9.1-5.8 12.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.2 19.2c-5.4-2-10.1-.6-11 3.4-.9 4 3 7.2 9.4 7.3M28.8 19.2c5.4-2 10.1-.6 11 3.4.9 4-3 7.2-9.4 7.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M24 14.5c-4.8 0-8.1 4.5-7 10.8 1.2 6.8 4.1 11.8 7 14.2 2.9-2.4 5.8-7.4 7-14.2 1.1-6.3-2.2-10.8-7-10.8Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M18.2 23h11.6M18.4 28.2h11.2M20 33.2h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="21.5" cy="18.9" r="1" fill="currentColor" />
      <circle cx="26.5" cy="18.9" r="1" fill="currentColor" />
      <path d="M21.2 15.3c-1.4-3.2-3.4-5-5.5-5.4M26.8 15.3c1.4-3.2 3.4-5 5.5-5.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="15.3" cy="9.8" r="1.4" fill="currentColor" />
      <circle cx="32.7" cy="9.8" r="1.4" fill="currentColor" />
    </svg>
  );
}
