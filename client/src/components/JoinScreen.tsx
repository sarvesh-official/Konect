import { useState, useEffect, useRef } from "react";
import { VARIANT_META, generatePreview } from "../pixi/SpriteLoader";
import MusicPlayer from "./MusicPlayer";

type Props = {
  onJoin: (name: string, variant: number) => void;
};

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
        ctx.globalAlpha = 0.15 + Math.random() * 0.15;
        ctx.fillText(ch, x, y);
        if (y > h && Math.random() > 0.975) drops[i] = 0;
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

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10" style={{ background: "#050507" }} />;
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
      <MusicPlayer />

      <form
        onSubmit={handleSubmit}
        className="z-10 flex w-[340px] flex-col items-center gap-4 rounded-xl border border-emerald-signal/20 bg-abyss/60 p-6 shadow-[0_0_60px_rgba(0,217,146,0.06)] backdrop-blur-xl sm:w-[400px] sm:gap-5 sm:p-8"
      >
        {/* Logo */}
        <img src="/logo.svg" alt="Konect" className="h-10 sm:h-12" />

        {/* Subtitle */}
        <p
          className="text-center text-xs tracking-wider text-emerald-signal/60 uppercase sm:text-sm"
          style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 500 }}
        >
          Choose your character
        </p>

        {/* Character picker */}
        <div className="grid w-full grid-cols-4 gap-1.5 sm:gap-2">
          {VARIANT_META.map((meta, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setVariant(i)}
              className={`flex flex-col items-center gap-1 rounded-lg border p-1.5 transition sm:p-2 ${
                variant === i
                  ? "border-emerald-signal bg-emerald-signal/10 shadow-[0_0_12px_rgba(0,217,146,0.15)]"
                  : "border-white/5 bg-white/[0.03] hover:border-emerald-signal/30 hover:bg-white/[0.05]"
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
              <span
                className="text-center text-[8px] leading-tight text-parchment/70 sm:text-[9px]"
                style={{ fontFamily: "Rajdhani, sans-serif" }}
              >
                {meta.label}
              </span>
            </button>
          ))}
        </div>

        {/* Name input */}
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          autoFocus
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm tracking-wide text-snow placeholder-white/20 outline-none transition focus:border-emerald-signal/50 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(0,217,146,0.08)]"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        />

        {/* Join button */}
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full rounded-lg border border-emerald-signal/40 bg-emerald-signal/10 py-2.5 text-sm font-semibold uppercase tracking-[3px] text-emerald-signal transition hover:border-emerald-signal/60 hover:bg-emerald-signal/20 hover:shadow-[0_0_20px_rgba(0,217,146,0.15)] disabled:opacity-20"
          style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700 }}
        >
          Enter the Office
        </button>

        {/* Footer */}
        <p
          className="text-[10px] tracking-widest text-white/15 uppercase"
          style={{ fontFamily: "Space Mono, monospace" }}
        >
          proximity-based connections
        </p>
      </form>
    </div>
  );
}
