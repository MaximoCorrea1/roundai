// Nimbo bottom navigation — 4 items, "Inicio" active. Conventional tab bar:
// active item in the wallet's slate-deep, the rest muted. Inline SVG only.

type NavKey = 'home' | 'cards' | 'pay' | 'help'

export function BottomNav({
  labels,
}: {
  labels: { home: string; cards: string; pay: string; help: string }
}) {
  const items: { key: NavKey; label: string }[] = [
    { key: 'home', label: labels.home },
    { key: 'cards', label: labels.cards },
    { key: 'pay', label: labels.pay },
    { key: 'help', label: labels.help },
  ]
  const active: NavKey = 'home'

  return (
    <nav
      className="shrink-0 border-t border-nimbo-line bg-nimbo-surface/95 px-3 pb-7 pt-2.5 backdrop-blur"
      aria-label="Navegación principal"
    >
      <ul className="flex items-stretch justify-between">
        {items.map((item) => {
          const isActive = item.key === active
          return (
            <li key={item.key} className="flex-1">
              <button
                type="button"
                className={`flex w-full flex-col items-center gap-1 ${
                  isActive ? 'text-nimbo-blue' : 'text-nimbo-slate'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <NavIcon nav={item.key} active={isActive} />
                <span className="text-[10.5px] font-medium tracking-wide">
                  {item.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function NavIcon({ nav, active }: { nav: NavKey; active: boolean }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 22 22',
    fill: 'none',
    'aria-hidden': true as const,
  }
  const stroke = {
    stroke: 'currentColor',
    strokeWidth: active ? 1.8 : 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  const fill = active ? 'currentColor' : 'none'
  const fillOpacity = active ? 0.12 : 0

  switch (nav) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 9.5 11 3l8 6.5" {...stroke} />
          <path d="M5 8.5V18h12V8.5" {...stroke} fill={fill} fillOpacity={fillOpacity} />
          <path d="M9 18v-4.5h4V18" {...stroke} />
        </svg>
      )
    case 'cards':
      return (
        <svg {...common}>
          <rect x="3" y="5.5" width="16" height="11" rx="2.4" {...stroke} fill={fill} fillOpacity={fillOpacity} />
          <path d="M3 9h16" {...stroke} />
          <path d="M6 13h3" {...stroke} />
        </svg>
      )
    case 'pay':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="14" height="14" rx="2.4" {...stroke} fill={fill} fillOpacity={fillOpacity} />
          <path d="M7 7.5h2.5v2.5H7zM12.5 12h2.5v2.5h-2.5zM7 12h2.5v2.5H7zM12.5 7.5h2.5V10h-2.5z" {...stroke} />
        </svg>
      )
    case 'help':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="8" {...stroke} fill={fill} fillOpacity={fillOpacity} />
          <path d="M8.8 8.4a2.2 2.2 0 0 1 4.3.6c0 1.5-2.1 1.9-2.1 3.2" {...stroke} />
          <circle cx="11" cy="15" r="0.6" fill="currentColor" />
        </svg>
      )
  }
}
