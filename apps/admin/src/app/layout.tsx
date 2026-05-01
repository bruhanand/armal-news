import type { ReactNode } from "react";

export const metadata = {
  title: "Armal News — Admin",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          padding: "32px",
          maxWidth: "1024px",
        }}
      >
        {children}
      </body>
    </html>
  );
}
