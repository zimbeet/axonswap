import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-128px)] px-4">
      <div className="text-center max-w-md">
        <div
          className="text-8xl font-bold mb-4"
          style={{
            background: "linear-gradient(135deg, #36B1FF, #6A75FF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">
          Page not found
        </h1>
        <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/">
          <Button size="lg" variant="primary">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
