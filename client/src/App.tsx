import { useState, useEffect } from "react";
import JoinScreen from "./components/JoinScreen";
import GameScreen from "./components/GameScreen";

type Session = { name: string; variant: number };

const STORAGE_KEY = "konect_session";

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSession(s: Session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [showResume, setShowResume] = useState<Session | null>(null);

  useEffect(() => {
    const prev = loadSession();
    if (prev) setShowResume(prev);
  }, []);

  const handleJoin = (name: string, variant: number) => {
    const s = { name, variant };
    saveSession(s);
    setSession(s);
    setShowResume(null);
  };

  const handleResume = () => {
    if (showResume) {
      setSession(showResume);
      setShowResume(null);
    }
  };

  const handleFresh = () => {
    clearSession();
    setShowResume(null);
  };

  // Resume prompt
  if (showResume && !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-abyss">
        <div className="flex w-[340px] flex-col items-center gap-5 rounded-xl border border-emerald-signal/20 bg-abyss/60 p-8 backdrop-blur-xl sm:w-[380px]">
          <img src="/favicon.svg" alt="" className="h-12 w-12" />
          <h2
            className="text-xl font-bold text-snow"
            style={{ fontFamily: "Rajdhani, sans-serif" }}
          >
            Welcome back!
          </h2>
          <p className="text-center text-sm text-parchment">
            Continue as <strong className="text-emerald-signal">{showResume.name}</strong>?
          </p>
          <button
            onClick={handleResume}
            className="w-full rounded-lg border border-emerald-signal/40 bg-emerald-signal/10 py-2.5 text-sm font-semibold uppercase tracking-[3px] text-emerald-signal transition hover:bg-emerald-signal/20"
            style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700 }}
          >
            Continue
          </button>
          <button
            onClick={handleFresh}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-2.5 text-sm text-parchment transition hover:bg-white/[0.06]"
            style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600 }}
          >
            New Identity
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return <JoinScreen onJoin={handleJoin} />;
  }

  return <GameScreen name={session.name} variant={session.variant} />;
}
