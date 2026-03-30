import type { Metadata } from "next";
import {
  Aladin,
  Aboreto,
  Comic_Neue,
  MedievalSharp,
  Nothing_You_Could_Do,
  Nova_Oval,
  Quintessential,
  Waterfall
} from "next/font/google";
import "./globals.css";

const waterfall = Waterfall({
  subsets: ["latin"],
  variable: "--font-waterfall",
  weight: "400"
});

const comicNeue = Comic_Neue({
  subsets: ["latin"],
  variable: "--font-comic-neue",
  weight: ["400", "700"]
});

const novaOval = Nova_Oval({
  subsets: ["latin"],
  variable: "--font-nova-oval",
  weight: "400"
});

const medievalSharp = MedievalSharp({
  subsets: ["latin"],
  variable: "--font-medieval-sharp",
  weight: "400"
});

const aladin = Aladin({
  subsets: ["latin"],
  variable: "--font-aladin",
  weight: "400"
});

const aboreto = Aboreto({
  subsets: ["latin"],
  variable: "--font-aboreto",
  weight: "400"
});

const quintessential = Quintessential({
  subsets: ["latin"],
  variable: "--font-quintessential",
  weight: "400"
});

const nothingYouCouldDo = Nothing_You_Could_Do({
  subsets: ["latin"],
  variable: "--font-nothing-you-could-do",
  weight: "400"
});

export const metadata: Metadata = {
  title: "Memory Lane",
  description: "A romantic photo memory gallery for couples"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${waterfall.variable} ${comicNeue.variable} ${novaOval.variable} ${medievalSharp.variable} ${aladin.variable} ${aboreto.variable} ${quintessential.variable} ${nothingYouCouldDo.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
