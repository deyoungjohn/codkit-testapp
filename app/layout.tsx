import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";

export const metadata = { title: "codkit test app", description: "A consumer app that installs @codkit/* from npm." };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
