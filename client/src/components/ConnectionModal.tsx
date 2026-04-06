type Props = {
  playerName: string;
  onAccept: () => void;
  onIgnore: () => void;
};

export default function ConnectionModal({ playerName, onAccept, onIgnore }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="flex w-72 flex-col items-center gap-4 rounded-lg border-2 border-emerald-signal bg-carbon p-6 text-center shadow-[rgba(0,0,0,0.7)_0px_20px_60px]">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-signal/10 text-lg text-emerald-signal">
          &#9889;
        </div>
        <h3 className="text-lg font-bold text-snow" style={{ fontFamily: "Rajdhani, sans-serif" }}>Player nearby!</h3>
        <p className="text-sm text-parchment">
          <strong className="text-snow">{playerName}</strong> is in your proximity.
          Connect and chat?
        </p>
        <div className="flex w-full gap-3">
          <button
            onClick={onAccept}
            className="flex-1 cursor-pointer rounded-md border border-mint bg-carbon py-2 text-sm font-semibold text-mint transition hover:bg-emerald-signal/10"
          >
            Connect
          </button>
          <button
            onClick={onIgnore}
            className="flex-1 cursor-pointer rounded-md border border-charcoal bg-abyss py-2 text-sm text-parchment transition hover:bg-white/5"
          >
            Ignore
          </button>
        </div>
      </div>
    </div>
  );
}
