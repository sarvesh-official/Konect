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
      // Play next track
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
      className="fixed bottom-3 right-3 z-20 flex items-center gap-2 rounded-lg border border-charcoal bg-carbon/90 px-3 py-2 text-xs backdrop-blur transition hover:bg-emerald-signal/10 sm:bottom-4 sm:right-4"
    >
      <span className="text-base">{playing ? "\u{1F50A}" : "\u{1F507}"}</span>
      <span className="hidden text-parchment sm:inline">
        {playing ? "Music On" : "Music Off"}
      </span>
    </button>
  );
}
