import { useState } from "react";
import JoinScreen from "./components/JoinScreen";
import GameScreen from "./components/GameScreen";

export default function App() {
  const [session, setSession] = useState<{ name: string; variant: number } | null>(null);

  if (!session) {
    return <JoinScreen onJoin={(name, variant) => setSession({ name, variant })} />;
  }

  return <GameScreen name={session.name} variant={session.variant} />;
}
