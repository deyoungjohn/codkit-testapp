import { ConnectButton } from "@codkit/ui";
import Link from "next/link";
import { Wallets } from "./wallets";

export default function Page() {
  return (
    <main>
      <header>
        <h1>codkit test app</h1>
        <nav>
          <Link href="/" aria-current="page">
            Wallets
          </Link>
          <Link href="/agent">Agent</Link>
          <ConnectButton />
        </nav>
      </header>
      <Wallets />
    </main>
  );
}
