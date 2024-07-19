import GameBoard from "@/components/GameBoard";
import Head from "next/head";
import Image from "next/image";

export default function Home() {
  return (
    <main>

<div className="min-h-screen flex flex-col items-center justify-center">
      <Head>
        <title>Emoji Memory Game</title>
        <meta name="description" content="A unique emoji memory game with changing themes" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 text-center">
        <h1 className="text-4xl font-bold mb-8">Emoji Memory Game</h1>
        <GameBoard />
      </main>
    </div>


    </main>
  );
}
