import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Pergola Cave Warranty Center",
  description: "Register your pergola and file warranty claims — powered by Warrantini.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider appearance={{ theme: shadcn }}>
          <header className="sticky top-0 z-50 flex items-center justify-between gap-6 border-b border-border bg-background/85 px-6 py-3 backdrop-blur">
            <Link href="/" className="flex items-center gap-2.5">
              <span
                className="grid size-8 shrink-0 grid-cols-2 gap-[3px] rounded-lg bg-foreground p-1.5"
                aria-hidden="true"
              >
                <span className="h-[2.5px] rounded-full bg-primary" />
                <span className="h-[2.5px] rounded-full bg-primary/55" />
                <span className="h-[2.5px] rounded-full bg-primary" />
                <span className="h-[2.5px] rounded-full bg-primary/55" />
              </span>
              <span className="text-[15px] font-extrabold tracking-wide uppercase">
                Pergola<span className="text-primary">Cave</span>
              </span>
            </Link>
            <nav className="flex items-center gap-5 text-sm font-semibold text-muted-foreground">
              <Show when="signed-in">
                <Link href="/registrations" className="transition-colors hover:text-primary">
                  My Registrations
                </Link>
                <Link href="/claims" className="transition-colors hover:text-primary">
                  My Claims
                </Link>
              </Show>
              <Link href="/warranty-policy" className="transition-colors hover:text-primary">
                Warranty Policy
              </Link>
              <Show when="signed-out">
                <SignInButton />
                <SignUpButton />
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </nav>
          </header>
          <main className="flex flex-1 flex-col">{children}</main>
          <footer className="border-t border-border px-6 py-5 text-center text-xs text-muted-foreground">
            Powered by Warrantini
          </footer>
        </ClerkProvider>
      </body>
    </html>
  );
}