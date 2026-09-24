import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Device Fleet Monitor",
  description: "Mini Device Fleet Monitor API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}