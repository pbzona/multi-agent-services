import type { Metadata } from "next";
import localFont from "next/font/local";
import { CustomerAgentDock } from "./_components/agent-panel";
import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";
import { getDemoPrincipal } from "./_lib/session";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Field & Form - Objects for focused rooms",
    template: "%s - Field & Form",
  },
  description:
    "Considered desk and home objects, selected for calmer everyday work.",
  applicationName: "Field & Form",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const principal = await getDemoPrincipal();

  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader principal={principal} />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <CustomerAgentDock role={principal.role} />
      </body>
    </html>
  );
}
