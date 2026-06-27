import "../../styles/global.css";
import { Metadata, Viewport } from "next";
import "./global.css";

export const metadata: Metadata = {
  title: "You Gotta Be Starting Something",
  description: "You Gotta Be Starting Something",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
