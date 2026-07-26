import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AM SPORTS",
  description: "Round-Robin League System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        <nav className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--line)", background: "var(--pitch-800)" }}>
          <Link href="/" className="flex items-center gap-2">
            <span style={{ fontFamily: "var(--font-display)", fontSize: "22px", letterSpacing: "1px", color: "var(--chalk)" }}>AM SPORTS</span>
            <span className="text-[10px] uppercase tracking-widest hidden sm:inline" style={{ color: "var(--amber)", fontFamily: "var(--font-mono)" }}>Round-Robin</span>
          </Link>
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--pitch-950)" }}>
            <NavLink href="/">Public</NavLink>
            <NavLink href="/admin">Admin</NavLink>
            <NavLink href="/captain">Captain</NavLink>
            <NavLink href="/login">Login</NavLink>
          </div>
        </nav>
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">{children}</main>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-md text-xs uppercase tracking-wide transition-colors"
      style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}
    >
      {children}
    </Link>
  );
}