import { useEffect, useRef, useState, useCallback } from "react";
import { PixiGame, type OnlinePlayer } from "../pixi/PixiGame";
import { socket } from "../socket";
import type { ChatMessage, NearbyPlayer } from "../types";
import ChatSidebar from "./ChatSidebar";
import ConnectionModal from "./ConnectionModal";
import MusicPlayer from "./MusicPlayer";

function loadChatHistory(name: string): Map<string, ChatMessage[]> {
  try {
    const stored = localStorage.getItem(`konect_chats_${name}`);
    return stored ? new Map(JSON.parse(stored)) : new Map();
  } catch { return new Map(); }
}

type Props = { name: string; variant: number };

export default function GameScreen({ name, variant }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<PixiGame | null>(null);

  const [nearbyPlayer, setNearbyPlayer] = useState<NearbyPlayer | null>(null);
  const [connectedPlayer, setConnectedPlayer] = useState<NearbyPlayer | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [canSit, setCanSit] = useState(false);
  const [isSitting, setIsSitting] = useState(false);
  const [dogNearby, setDogNearby] = useState(false);

  // Per-player message history — loaded from localStorage, survives refresh
  const chatHistory = useRef<Map<string, ChatMessage[]>>(loadChatHistory(name));
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const saveHistory = () => {
    try {
      localStorage.setItem(
        `konect_chats_${name}`,
        JSON.stringify(Array.from(chatHistory.current.entries())),
      );
    } catch { /* storage full */ }
  };

  const onNearby = useCallback((p: NearbyPlayer) => setNearbyPlayer(p), []);
  const onLeaveProximity = useCallback(() => { setNearbyPlayer(null); setDismissed(null); }, []);
  const onPlayersChanged = useCallback((p: OnlinePlayer[]) => setOnlinePlayers(p), []);
  const onSeatNearby = useCallback((v: boolean) => setCanSit(v), []);
  const onDogNearby = useCallback((v: boolean) => setDogNearby(v), []);

  useEffect(() => {
    if (!containerRef.current) return;
    const game = new PixiGame({ onNearby, onLeaveProximity, onPlayersChanged, onSeatNearby, onDogNearby });
    gameRef.current = game;
    game.mount(containerRef.current, name, variant);

    socket.on("chat_message", (msg: ChatMessage) => {
      const history = chatHistory.current;
      const existing = history.get(msg.senderName) ?? [];
      existing.push(msg);
      history.set(msg.senderName, existing);
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("chat_history", (msgs: ChatMessage[]) => {
      if (msgs.length > 0) setMessages(msgs);
    });

    return () => { socket.off("chat_message"); socket.off("chat_history"); game.destroy(); };
  }, [name, variant, onNearby, onLeaveProximity, onPlayersChanged, onSeatNearby, onDogNearby]);

  const handleSit = () => {
    gameRef.current?.toggleSit();
    setIsSitting((s) => !s);
  };

  const handleAccept = () => {
    if (!nearbyPlayer) return;
    setConnectedPlayer(nearbyPlayer);
    setNearbyPlayer(null);
    // Restore any previous messages with this player (keyed by name)
    const prev = chatHistory.current.get(nearbyPlayer.name) ?? [];
    setMessages([...prev]);
    socket.emit("load_chat_history", { partnerName: nearbyPlayer.name });
  };

  const handleIgnore = () => { if (nearbyPlayer) { setDismissed(nearbyPlayer.id); setNearbyPlayer(null); } };

  const handleDisconnect = () => {
    if (connectedPlayer) {
      chatHistory.current.set(connectedPlayer.name, [...messages]);
      saveHistory();
    }
    setConnectedPlayer(null);
    setMessages([]);
  };

  const handleSend = (message: string) => {
    if (!connectedPlayer) return;
    socket.emit("chat_message", { message, targetId: connectedPlayer.id });
    const msg: ChatMessage = { senderName: name, message, timestamp: Date.now() };
    const history = chatHistory.current;
    const existing = history.get(connectedPlayer.name) ?? [];
    existing.push(msg);
    history.set(connectedPlayer.name, existing);
    saveHistory();
    setMessages((prev) => [...prev, msg]);
  };

  const showModal = nearbyPlayer && !connectedPlayer && nearbyPlayer.id !== dismissed;

  // Mobile d-pad handlers
  const dpad = (key: string, down: boolean) => gameRef.current?.setKey(key, down);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-abyss">
      <div ref={containerRef} className="h-full w-full" />

      {/* Top bar */}
      <div className="pointer-events-none fixed left-0 top-0 z-10 flex w-full items-center justify-between px-4 py-2 sm:px-5 sm:py-3">
        <div className="flex items-center gap-1 sm:gap-2">
          <img src="/favicon.svg" alt="" className="h-6 w-6 sm:h-8 sm:w-8" />
          <span className="text-xs font-bold tracking-widest text-snow/70 sm:text-sm" style={{ fontFamily: "Rajdhani, sans-serif" }}>ONECT</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-charcoal bg-carbon/80 px-2.5 py-1 backdrop-blur sm:px-3 sm:py-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-signal" />
          <span className="text-[10px] text-parchment sm:text-xs">{onlinePlayers.length} online</span>
        </div>
      </div>

      {/* Online players panel (hidden on mobile when chat open) */}
      <div className={`pointer-events-none fixed right-3 top-12 z-10 w-40 sm:right-4 sm:top-14 sm:w-48 ${connectedPlayer ? "hidden sm:block" : ""}`}>
        <div className="rounded-lg border border-charcoal bg-carbon/80 p-2.5 backdrop-blur sm:p-3">
          <h4 className="mb-1.5 text-[9px] font-semibold uppercase tracking-[2px] text-slate-steel sm:mb-2 sm:text-[10px]" style={{ fontFamily: "Rajdhani, sans-serif" }}>PEOPLES</h4>
          <div className="flex flex-col gap-1">
            {onlinePlayers.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.isSelf ? "#00d992" : "#fb565b" }} />
                <span className="truncate text-[10px] text-snow/80 sm:text-xs">
                  {p.name} {p.isSelf && <span className="text-emerald-signal">(you)</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop controls hint */}
      <div className="pointer-events-none fixed bottom-3 left-3 z-10 hidden sm:block">
        <div className="flex items-center gap-3 rounded-lg border border-charcoal bg-carbon/80 px-3 py-2 backdrop-blur">
          <div className="flex flex-col items-center gap-0.5">
            <kbd className="flex h-5 w-5 items-center justify-center rounded border border-charcoal bg-abyss text-[9px] text-parchment">W</kbd>
            <div className="flex gap-0.5">
              <kbd className="flex h-5 w-5 items-center justify-center rounded border border-charcoal bg-abyss text-[9px] text-parchment">A</kbd>
              <kbd className="flex h-5 w-5 items-center justify-center rounded border border-charcoal bg-abyss text-[9px] text-parchment">S</kbd>
              <kbd className="flex h-5 w-5 items-center justify-center rounded border border-charcoal bg-abyss text-[9px] text-parchment">D</kbd>
            </div>
          </div>
          <div className="flex flex-col text-[9px] text-slate-steel">
            <span>Move</span>
            <span><kbd className="rounded border border-charcoal bg-abyss px-1 text-parchment">Shift</kbd> Sprint</span>
            <span><kbd className="rounded border border-charcoal bg-abyss px-1 text-parchment">E</kbd> Sit/Stand</span>
            <span><kbd className="rounded border border-charcoal bg-abyss px-1 text-parchment">F</kbd> Pet dog</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className={`fixed bottom-20 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-4 ${connectedPlayer ? "hidden sm:flex" : ""}`}>
        {(canSit || isSitting) && (
          <button
            onClick={handleSit}
            className="rounded-full border border-emerald-signal/40 bg-carbon/90 px-5 py-2 text-xs font-semibold text-emerald-signal backdrop-blur transition hover:bg-emerald-signal/10"
          >
            {isSitting ? "Stand up" : "Sit down"} <span className="hidden text-slate-steel sm:inline">(E)</span>
          </button>
        )}
        {dogNearby && (
          <button
            onClick={() => gameRef.current?.petDog()}
            className="rounded-full border border-amber-400/40 bg-carbon/90 px-5 py-2 text-xs font-semibold text-amber-400 backdrop-blur transition hover:bg-amber-400/10"
          >
            Pet dog <span className="hidden text-slate-steel sm:inline">(F)</span>
          </button>
        )}
      </div>

      {/* Mobile D-Pad */}
      <div className={`fixed bottom-4 left-4 z-20 sm:hidden ${connectedPlayer ? "hidden" : ""}`}>
        <div className="flex flex-col items-center gap-1">
          <button
            onTouchStart={() => dpad("w", true)}
            onTouchEnd={() => dpad("w", false)}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-charcoal bg-carbon/90 text-sm text-parchment active:bg-emerald-signal/20"
          >
            &#9650;
          </button>
          <div className="flex gap-1">
            <button
              onTouchStart={() => dpad("a", true)}
              onTouchEnd={() => dpad("a", false)}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-charcoal bg-carbon/90 text-sm text-parchment active:bg-emerald-signal/20"
            >
              &#9664;
            </button>
            <button
              onTouchStart={() => dpad("s", true)}
              onTouchEnd={() => dpad("s", false)}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-charcoal bg-carbon/90 text-sm text-parchment active:bg-emerald-signal/20"
            >
              &#9660;
            </button>
            <button
              onTouchStart={() => dpad("d", true)}
              onTouchEnd={() => dpad("d", false)}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-charcoal bg-carbon/90 text-sm text-parchment active:bg-emerald-signal/20"
            >
              &#9654;
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sprint button */}
      <div className={`fixed bottom-4 right-4 z-20 sm:hidden ${connectedPlayer ? "hidden" : ""}`}>
        <button
          onTouchStart={() => dpad("shift", true)}
          onTouchEnd={() => dpad("shift", false)}
          className="flex h-11 items-center justify-center rounded-lg border border-charcoal bg-carbon/90 px-4 text-[10px] font-bold tracking-wider text-parchment active:bg-emerald-signal/20"
        >
          SPRINT
        </button>
      </div>

      {/* Music toggle */}
      <MusicPlayer />

      {/* Connection modal */}
      {showModal && (
        <ConnectionModal playerName={nearbyPlayer.name} onAccept={handleAccept} onIgnore={handleIgnore} />
      )}

      {/* Chat sidebar */}
      {connectedPlayer && (
        <ChatSidebar
          partnerName={connectedPlayer.name}
          messages={messages}
          selfName={name}
          onSend={handleSend}
          onClose={handleDisconnect}
          onFocusChange={(focused) => gameRef.current?.setChatFocused(focused)}
        />
      )}
    </div>
  );
}
