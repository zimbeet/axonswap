import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-128px)] px-4">
      <div className="text-center">
        <div
          className="text-4xl font-bold mb-6 animate-pulse"
          style={{
            background: "linear-gradient(135deg, #36B1FF, #6A75FF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          ⚡ AxonSwap
        </div>
        <div className="flex flex-col items-center gap-3">
          <Skeleton width={320} height={16} rounded="rounded-full" />
          <Skeleton width={240} height={12} rounded="rounded-full" />
        </div>
      </div>
    </div>
  );
}
