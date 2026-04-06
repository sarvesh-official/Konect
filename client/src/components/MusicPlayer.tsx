import { useRef, useState, useEffect } from "react";

const TRACKS = ["/music/lofi1.mp3", "/music/lofi2.mp3"];
const MUSIC_PREF_KEY = "konect_music_enabled";

function readMusicPreference(): boolean {
  try {
    const raw = localStorage.getItem(MUSIC_PREF_KEY);
    if (raw === null) return true; // first-time users default to music on
    return raw === "true";
  } catch {
    return true;
  }
}

function writeMusicPreference(enabled: boolean) {
  try {
    localStorage.setItem(MUSIC_PREF_KEY, String(enabled));
  } catch {
    // ignore storage errors
  }
}

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<boolean>(() => readMusicPreference());
  const [trackIdx, setTrackIdx] = useState(0);
  const triedAutoplay = useRef(false);
  const playingRef = useRef(playing);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    const audio = new Audio(TRACKS[0]);
    audio.loop = false;
    audio.volume = 0.3;
    audioRef.current = audio;

    const onEnded = () => {
      setTrackIdx((prev) => {
        const next = (prev + 1) % TRACKS.length;
        audio.src = TRACKS[next];
        if (playingRef.current) {
          audio.play().catch(() => {});
        }
        return next;
      });
    };
    audio.addEventListener("ended", onEnded);

    // Autoplay on first user interaction (browsers block autoplay without a gesture)
    const autoplay = () => {
      if (triedAutoplay.current) return;
      if (!playingRef.current) return;
      triedAutoplay.current = true;
      audio.play().then(() => setPlaying(true)).catch(() => {});
      window.removeEventListener("click", autoplay);
      window.removeEventListener("keydown", autoplay);
      window.removeEventListener("touchstart", autoplay);
    };

    window.addEventListener("click", autoplay);
    window.addEventListener("keydown", autoplay);
    window.addEventListener("touchstart", autoplay);

    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("ended", onEnded);
      window.removeEventListener("click", autoplay);
      window.removeEventListener("keydown", autoplay);
      window.removeEventListener("touchstart", autoplay);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      writeMusicPreference(false);
      setPlaying(false);
    } else {
      audio.src = TRACKS[trackIdx];
      audio.play().catch(() => {});
      writeMusicPreference(true);
      setPlaying(true);
    }
  };

  return (
    <button
      onClick={toggle}
      className="fixed bottom-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-transparent transition sm:bottom-4 sm:right-4"
      title={playing ? "Mute" : "Play music"}
    >
      {playing ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00d992" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#00d992" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#8b949e" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      )}
    </button>
  );
}
