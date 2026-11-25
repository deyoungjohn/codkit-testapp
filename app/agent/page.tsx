import { ConnectButton } from "@codkit/ui";
import Link from "next/link";
import { Chat } from "./chat";

export default function Page() {
  return (
    <main>
      <header>
        <h1>codkit test app</h1>
        <nav>
          <Link href="/">Wallets</Link>
          <Link href="/agent" aria-current="page">
            Agent
          </Link>
          <ConnectButton />
        </nav>
      </header>
      <Chat />
    </main>
  );
}
