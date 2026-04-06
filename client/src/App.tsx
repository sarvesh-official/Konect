import { useState } from "react";
import JoinScreen from "./components/JoinScreen";
import GameScreen from "./components/GameScreen";

export default function App() {
  const [name, setName] = useState<string | null>(null);

  if (!name) {
    return <JoinScreen onJoin={(n) => setName(n)} />;
  }

  return <GameScreen name={name} />;
}
