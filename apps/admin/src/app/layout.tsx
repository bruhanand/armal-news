import type { ReactNode } from "react";
import "./globals.css";
import { Sidebar } from "./_components/Sidebar";
import { ToastProvider } from "./_components/ToastProvider";

export const metadata = {
  title: "Armal News — Admin",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <div className="app-shell">
            <Sidebar />
            <main className="content">{children}</main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
