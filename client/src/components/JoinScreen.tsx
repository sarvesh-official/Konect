import { useState, useEffect } from "react";
import { VARIANT_META, generatePreview } from "../pixi/SpriteLoader";

type Props = {
  onJoin: (name: string, variant: number) => void;
};

export default function JoinScreen({ onJoin }: Props) {
  const [name, setName] = useState("");
  const [variant, setVariant] = useState(0);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    Promise.all(VARIANT_META.map((_, i) => generatePreview(i))).then(setPreviews);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onJoin(name.trim(), variant);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-abyss">
      <form
        onSubmit={handleSubmit}
        className="flex w-[360px] flex-col items-center gap-5 rounded-lg border border-charcoal bg-carbon p-8"
      >
        <img src="/logo.svg" alt="Konect" className="h-12" />
        <p className="text-sm text-parchment">Choose your character and enter the office</p>

        {/* Character picker */}
        <div className="flex w-full gap-2">
          {VARIANT_META.map((meta, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setVariant(i)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg border p-2 transition ${
                variant === i
                  ? "border-emerald-signal bg-emerald-signal/10"
                  : "border-charcoal bg-abyss hover:border-parchment/30"
              }`}
            >
              {previews[i] ? (
                <img
                  src={previews[i]}
                  alt={meta.label}
                  className="h-16 w-16"
                  style={{ imageRendering: "pixelated" }}
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center text-xs text-slate-steel">...</div>
              )}
              <span className="text-[9px] leading-tight text-parchment">{meta.label}</span>
            </button>
          ))}
        </div>

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
