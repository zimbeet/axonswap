import Link from "next/link";

const FOOTER_LINKS = [
  { href: "https://axonchain.ai", label: "Axonchain" },
  { href: "https://explorer.axonchain.ai", label: "Explorer" },
  { href: "#", label: "Docs" },
  { href: "#", label: "GitHub" },
];

export function Footer() {
  return (
    <footer
      className="mt-auto py-6 px-6 text-sm"
      style={{
        borderTop: "1px solid var(--border-default)",
        color: "var(--text-tertiary)",
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>© 2024 AxonSwap. Built on Axonchain.</span>
        <div className="flex items-center gap-5">
          {FOOTER_LINKS.map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="hover:text-[var(--text-secondary)] transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
