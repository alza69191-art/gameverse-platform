import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  verification: { google: "lZ0Zz3K7Cplr5vKpdXp-g1gPe5deSqvOt-g39D0oWaE" },
  title: "GameVerse",
  description: "اكتشف ألعاب المتصفح وحمّل ألعاب الحاسوب والهاتف.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
