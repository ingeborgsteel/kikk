interface NorwayIconProps {
  size?: number | string;
  className?: string;
}

/** Norway mainland outline — traced from the Simplemaps SVG, stroke-only. */
export function NorwayIcon({ size = 24, className }: NorwayIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M 16.2 0.8 L 17.6 0.8 L 17.4 2 L 18.1 0.8 L 18.5 1.4 L 21.4 0.8 L 22 1.5 L 20.1 1.9 L 21.9 3.1 L 21.3 2.9 L 20.4 4.2 L 20.5 2.9 L 19.4 2 L 18.1 2.8 L 17.3 5.2 L 15.4 4.9 L 14.6 3.7 L 13.7 4.3 L 13.5 5.7 L 12.3 5.2 L 12 6.4 L 11.1 6.6 L 10.1 9.7 L 9.4 10.1 L 9.1 13.6 L 8.1 13.9 L 7.5 15.1 L 8.2 18.3 L 7.2 22 L 6.3 20.9 L 4.6 23.1 L 3.4 23.2 L 2.5 22.2 L 3 21.2 L 2.3 21.6 L 3.1 20 L 2.3 20.9 L 2.8 20.3 L 2.2 18.9 L 4 18.5 L 2.3 18.6 L 2 17.5 L 3.5 16 L 4.2 16.3 L 3.8 15.6 L 7.1 14.2 L 6 14.8 L 5.6 14.3 L 7.3 12.5 L 6.5 12.3 L 8 11.3 L 8.7 8.5 L 10.2 7.5 L 9.6 6.8 L 11.8 5.5 L 10.9 5.5 L 12.1 4 L 11.3 4.3 L 11.2 3.5 L 11.8 3 L 12.8 3.7 L 12.7 3.2 L 13.1 3.8 L 12.8 3 L 13.4 2.6 L 13.3 3.4 L 13.8 2.2 L 13.6 3.6 L 14.6 2.1 L 15.1 2.5 L 14.9 1.3 L 16.2 2.2 L 16.2 0.8 Z" />
    </svg>
  );
}
