import type { Metadata } from "next";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ToastContainer } from "@/components/ui/ToastContainer";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "AxonSwap — DEX on Axonchain",
    template: "%s | AxonSwap",
  },
  description:
    "The native decentralized exchange on Axonchain. Swap tokens and provide concentrated liquidity with minimal slippage.",
  keywords: [
    "DEX",
    "DeFi",
    "Axonchain",
    "AxonSwap",
    "swap",
    "liquidity",
    "AMM",
    "Uniswap V3",
  ],
  authors: [{ name: "AxonSwap" }],
  creator: "AxonSwap",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://axonswap.fi",
    siteName: "AxonSwap",
    title: "AxonSwap — DEX on Axonchain",
    description:
      "The native decentralized exchange on Axonchain. Swap tokens and provide concentrated liquidity with minimal slippage.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AxonSwap — DEX on Axonchain",
    description:
      "The native decentralized exchange on Axonchain. Swap tokens and provide concentrated liquidity with minimal slippage.",
    creator: "@AxonSwap",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="relative min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 pt-16">{children}</main>
            <Footer />
            <ToastContainer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
