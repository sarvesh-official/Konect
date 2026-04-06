import { useState, useEffect, useRef } from "react";
import { VARIANT_META, generatePreview } from "../pixi/SpriteLoader";

type Props = {
  onJoin: (name: string, variant: number) => void;
};

/** Canvas-based matrix rain background */
function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const fontSize = 14;
    let columns = Math.floor(w / fontSize);
    let drops = Array.from({ length: columns }, () => Math.random() * -50);

    const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン01";

    const draw = () => {
      ctx.fillStyle = "rgba(5, 5, 7, 0.08)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#00d992";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Vary opacity for depth
        ctx.globalAlpha = 0.15 + Math.random() * 0.15;
        ctx.fillText(ch, x, y);

        if (y > h && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.5 + Math.random() * 0.5;
      }
      ctx.globalAlpha = 1;
    };

    const interval = setInterval(draw, 50);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      columns = Math.floor(w / fontSize);
      drops = Array.from({ length: columns }, () => Math.random() * -50);
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ background: "#050507" }}
    />
  );
}

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
    <div className="relative flex h-screen items-center justify-center overflow-hidden">
      <MatrixRain />

      <form
        onSubmit={handleSubmit}
        className="z-10 flex w-[340px] flex-col items-center gap-4 rounded-lg border border-charcoal bg-carbon/95 p-6 backdrop-blur sm:w-[380px] sm:gap-5 sm:p-8"
      >
        <img src="/logo.svg" alt="Konect" className="h-10 sm:h-12" />
        <p className="text-center text-xs text-parchment sm:text-sm">
          Choose your character and enter the office
        </p>

        {/* Character picker — 2×2 grid on small screens */}
        <div className="grid w-full grid-cols-4 gap-1.5 sm:gap-2">
          {VARIANT_META.map((meta, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setVariant(i)}
              className={`flex flex-col items-center gap-1 rounded-lg border p-1.5 transition sm:p-2 ${
                variant === i
                  ? "border-emerald-signal bg-emerald-signal/10"
                  : "border-charcoal bg-abyss hover:border-parchment/30"
              }`}
            >
              {previews[i] ? (
                <img
                  src={previews[i]}
                  alt={meta.label}
                  className="h-12 w-12 sm:h-14 sm:w-14"
                  style={{ imageRendering: "pixelated" }}
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center text-[10px] text-slate-steel sm:h-14 sm:w-14">
                  ...
                </div>
              )}
              <span className="text-center text-[8px] leading-tight text-parchment sm:text-[9px]">
                {meta.label}
              </span>
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
          className="w-full rounded-md border border-charcoal bg-abyss px-4 py-2.5 text-sm text-snow placeholder-slate-steel outline-none transition focus:border-emerald-signal"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full rounded-md border border-mint bg-carbon py-2.5 text-sm font-semibold text-mint transition hover:bg-emerald-signal/10 disabled:opacity-30"
        >
          Join Game
        </button>
      </form>
    </div>
  );
}
