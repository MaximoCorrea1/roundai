// iOS-style status bar: 9:41 + cellular / wifi / battery glyphs as inline SVG
// (no icon-library dependency — per brand banned list). Sits clear of the
// dynamic island: the time hugs the left, the radios hug the right, the island
// occupies the centre gap.

export function StatusBar() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-[54px] items-center justify-between pl-[34px] pr-[30px] pt-[6px] text-ink">
      {/* time */}
      <span
        className="tnum text-[17px] font-semibold leading-none tracking-tight"
        style={{ fontFeatureSettings: '"tnum" 1' }}
      >
        9:41
      </span>

      {/* radios */}
      <div className="flex items-center gap-[7px]">
        {/* cellular — four ascending bars */}
        <svg
          width="18"
          height="12"
          viewBox="0 0 18 12"
          fill="none"
          aria-hidden="true"
        >
          <rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor" />
          <rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor" />
          <rect x="15" y="0.5" width="3" height="11.5" rx="1" fill="currentColor" />
        </svg>

        {/* wifi */}
        <svg
          width="17"
          height="12"
          viewBox="0 0 17 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M8.5 1.2C5.2 1.2 2.2 2.5 0 4.6l1.7 1.8C3.5 4.7 5.9 3.7 8.5 3.7s5 1 6.8 2.7L17 4.6C14.8 2.5 11.8 1.2 8.5 1.2Z"
            fill="currentColor"
          />
          <path
            d="M8.5 6c-1.7 0-3.2.7-4.4 1.8l1.8 1.9c.7-.7 1.6-1.1 2.6-1.1s1.9.4 2.6 1.1l1.8-1.9C11.7 6.7 10.2 6 8.5 6Z"
            fill="currentColor"
          />
          <circle cx="8.5" cy="10.6" r="1.4" fill="currentColor" />
        </svg>

        {/* battery */}
        <svg
          width="28"
          height="13"
          viewBox="0 0 28 13"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="0.6"
            y="0.6"
            width="23"
            height="11.8"
            rx="3.4"
            stroke="currentColor"
            strokeOpacity="0.4"
            strokeWidth="1.1"
          />
          <rect x="2.4" y="2.4" width="16.5" height="8.2" rx="2" fill="currentColor" />
          <path
            d="M25.4 4.2c.9.3 1.4 1 1.4 2.3s-.5 2-1.4 2.3V4.2Z"
            fill="currentColor"
            fillOpacity="0.5"
          />
        </svg>
      </div>
    </div>
  )
}
