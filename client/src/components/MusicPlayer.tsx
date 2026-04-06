import { useRef, useState, useEffect } from "react";

const TRACKS = ["/music/lofi1.mp3", "/music/lofi2.mp3"];

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [trackIdx, setTrackIdx] = useState(0);

  useEffect(() => {
    const audio = new Audio(TRACKS[0]);
    audio.loop = false;
    audio.volume = 0.3;
    audioRef.current = audio;

    audio.addEventListener("ended", () => {
      setTrackIdx((prev) => {
        const next = (prev + 1) % TRACKS.length;
        audio.src = TRACKS[next];
        audio.play();
        return next;
      });
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
    } else {
      audio.src = TRACKS[trackIdx];
      audio.play();
    }
    setPlaying(!playing);
  };

  return (
    <button
      onClick={toggle}
      className="fixed bottom-3 right-3 bg-transparent z-20 flex h-10 w-10 items-center justify-center rounded-full border border-charcoal transition sm:bottom-4 sm:right-4"
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
