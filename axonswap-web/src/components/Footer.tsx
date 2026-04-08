import { Github, Twitter, BookOpen, Send } from 'lucide-react'

const SOCIAL_LINKS = [
  { icon: Twitter, label: 'Twitter', href: 'https://twitter.com/AxonSwap' },
  { icon: Send, label: 'Telegram', href: 'https://t.me/AxonSwap' },
  { icon: Github, label: 'GitHub', href: 'https://github.com/AxonSwap' },
  { icon: BookOpen, label: 'Docs', href: 'https://docs.axonswap.com' },
]

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          © 2026 AxonSwap · BSC Testnet
        </span>
        <div className="flex items-center gap-4">
          {SOCIAL_LINKS.map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={label}
              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Icon size={16} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
