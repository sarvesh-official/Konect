import { useState } from "react";

type Props = {
  onJoin: (name: string) => void;
};

export default function JoinScreen({ onJoin }: Props) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name.trim());
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-abyss">
      <form
        onSubmit={handleSubmit}
        className="flex w-80 flex-col items-center gap-5 rounded-lg border border-charcoal bg-carbon p-8"
      >
        <img src="/logo.svg" alt="Konect" className="h-12" />
        <p className="text-sm tracking-wide text-parchment">
          Enter your name to join the game
        </p>

        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          autoFocus
          className="w-full rounded-md border border-charcoal bg-abyss px-4 py-3 text-sm text-snow placeholder-slate-steel outline-none transition focus:border-emerald-signal"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full cursor-pointer rounded-md border border-mint bg-carbon py-3 text-sm font-semibold text-mint transition hover:bg-emerald-signal/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Join Game
        </button>
      </form>
    </div>
  );
}
