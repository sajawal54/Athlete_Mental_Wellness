import { useCallback, useEffect, useRef, useState } from "react";
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowPathIcon,
  MusicalNoteIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { getSoundTracks } from "../services/soundTherapyService";

const CATEGORIES = [
  { id: "all", label: "All", icon: "🎧" },
  { id: "rain", label: "Rain", icon: "🌧️" },
  { id: "ocean", label: "Ocean", icon: "🌊" },
  { id: "forest", label: "Forest", icon: "🌲" },
  { id: "wind", label: "Wind", icon: "💨" },
  { id: "meditation", label: "Meditation", icon: "🧘" },
];

const CATEGORY_STYLES = {
  rain: {
    icon: "🌧️",
    bg: "from-blue-500/15 to-cyan-500/10",
    border: "border-blue-400/20",
  },
  ocean: {
    icon: "🌊",
    bg: "from-cyan-500/15 to-blue-500/10",
    border: "border-cyan-400/20",
  },
  forest: {
    icon: "🌲",
    bg: "from-emerald-500/15 to-green-500/10",
    border: "border-emerald-400/20",
  },
  wind: {
    icon: "💨",
    bg: "from-slate-500/15 to-slate-400/10",
    border: "border-slate-400/20",
  },
  meditation: {
    icon: "🧘",
    bg: "from-violet-500/15 to-purple-500/10",
    border: "border-violet-400/20",
  },
};

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export default function SoundTherapy() {
  const [tracks, setTracks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingAudio, setLoadingAudio] = useState(false);

  const [error, setError] = useState(null);
  const [audioError, setAudioError] = useState(null);

  const [recentlyPlayed, setRecentlyPlayed] = useState(() => {
    try {
      const savedHistory = localStorage.getItem("sound_therapy_history");

      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
      console.error("Failed to load history from localStorage:", error);

      return [];
    }
  });

  const audioRef = useRef(null);

  // --------------------------------------------------
  // LOAD TRACKS
  // --------------------------------------------------

  useEffect(() => {
    let isMounted = true;

    const loadTracks = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getSoundTracks(selectedCategory);
        const soundTracks = Array.isArray(data) ? data : data?.results || [];

        if (isMounted) {
          setTracks(soundTracks);
        }
      } catch (error) {
        console.error("Failed to load sound therapy tracks:", error);

        if (isMounted) {
          setError("Unable to load sound therapy tracks. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTracks();

    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  // --------------------------------------------------
  // AUDIO CLEANUP
  // --------------------------------------------------

  const destroyAudioInstance = useCallback(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.pause();

    audioRef.current.onloadedmetadata = null;
    audioRef.current.ontimeupdate = null;
    audioRef.current.onplay = null;
    audioRef.current.onpause = null;
    audioRef.current.onended = null;
    audioRef.current.onerror = null;

    audioRef.current.removeAttribute("src");
    audioRef.current.load();

    audioRef.current = null;
  }, []);

  // --------------------------------------------------
  // CLEANUP ON UNMOUNT
  // --------------------------------------------------

  useEffect(() => {
    return () => {
      destroyAudioInstance();
    };
  }, [destroyAudioInstance]);

  // --------------------------------------------------
  // SYNC VOLUME
  // --------------------------------------------------

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // --------------------------------------------------
  // RECENTLY PLAYED
  // --------------------------------------------------

  const addToRecentlyPlayed = useCallback((track) => {
    setRecentlyPlayed((previous) => {
      const filtered = previous.filter((item) => item.id !== track.id);

      const updated = [track, ...filtered].slice(0, 5);

      try {
        localStorage.setItem("sound_therapy_history", JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to save history to localStorage:", error);
      }

      return updated;
    });
  }, []);

  // --------------------------------------------------
  // PLAY TRACK
  // --------------------------------------------------

  const handlePlayTrack = useCallback(
    async (track) => {
      if (!track?.audio_url) {
        setAudioError("This sound track is currently unavailable.");
        return;
      }

      setAudioError(null);

      try {
        setLoadingAudio(true);

        // Same track -> toggle play/pause
        if (activeTrack?.id === track.id && audioRef.current) {
          if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
          } else {
            await audioRef.current.play();
            setIsPlaying(true);
          }

          setLoadingAudio(false);
          return;
        }

        // Destroy previous audio instance
        destroyAudioInstance();

        const audio = new Audio(track.audio_url);

        audioRef.current = audio;

        audio.preload = "metadata";
        audio.volume = isMuted ? 0 : volume;

        audio.onloadedmetadata = () => {
          setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
        };

        audio.ontimeupdate = () => {
          setCurrentTime(audio.currentTime);
        };

        audio.onplay = () => {
          setIsPlaying(true);
          setLoadingAudio(false);
        };

        audio.onpause = () => {
          setIsPlaying(false);
        };

        audio.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };

        audio.onerror = (event) => {
          console.error("Audio failed to load:", track.audio_url, event);

          setIsPlaying(false);
          setLoadingAudio(false);

          setAudioError(
            `Unable to load sound from local server. Please ensure Django is serving media files properly at: ${track.audio_url}`,
          );
        };

        setActiveTrack(track);
        setCurrentTime(0);
        setDuration(0);

        addToRecentlyPlayed(track);

        await audio.play();
      } catch (error) {
        console.error("Audio playback failed:", error);

        setIsPlaying(false);
        setLoadingAudio(false);

        setAudioError(
          "Unable to play this sound. Please check backend connection.",
        );
      }
    },
    [
      activeTrack,
      isPlaying,
      isMuted,
      volume,
      destroyAudioInstance,
      addToRecentlyPlayed,
    ],
  );

  // --------------------------------------------------
  // PAUSE
  // --------------------------------------------------

  const handlePause = useCallback(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  // --------------------------------------------------
  // STOP
  // --------------------------------------------------

  const handleStop = useCallback(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.pause();
    audioRef.current.currentTime = 0;

    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  // --------------------------------------------------
  // CLOSE PLAYER
  // --------------------------------------------------

  const handleClosePlayer = useCallback(() => {
    handleStop();
    destroyAudioInstance();
    setActiveTrack(null);
    setCurrentTime(0);
    setDuration(0);
    setLoadingAudio(false);
    setAudioError(null);
  }, [handleStop, destroyAudioInstance]);

  // --------------------------------------------------
  // SEEK
  // --------------------------------------------------

  const handleSeek = useCallback(
    (event) => {
      if (!audioRef.current || !duration) {
        return;
      }

      const newTime = Number(event.target.value);

      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration],
  );

  // --------------------------------------------------
  // VOLUME
  // --------------------------------------------------

  const handleVolumeChange = useCallback((event) => {
    const newVolume = Number(event.target.value);

    setVolume(newVolume);

    if (newVolume > 0) {
      setIsMuted(false);
    }
  }, []);

  // --------------------------------------------------
  // MUTE
  // --------------------------------------------------

  const handleMute = useCallback(() => {
    setIsMuted((previous) => !previous);
  }, []);

  // --------------------------------------------------
  // RETRY
  // --------------------------------------------------

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  // --------------------------------------------------
  // KEYBOARD SHORTCUTS
  // --------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (event) => {
      const activeElement = document.activeElement;

      if (["INPUT", "TEXTAREA", "SELECT"].includes(activeElement?.tagName)) {
        return;
      }

      if (!activeTrack) {
        return;
      }

      // Space -> Play / Pause
      if (event.key === " ") {
        event.preventDefault();

        if (isPlaying) {
          handlePause();
        } else {
          handlePlayTrack(activeTrack);
        }
      }

      // Escape -> Close player
      if (event.key === "Escape") {
        handleClosePlayer();
      }

      // Right Arrow -> Forward 5 seconds
      if (event.key === "ArrowRight") {
        event.preventDefault();

        if (audioRef.current) {
          const newTime = Math.min(audioRef.current.currentTime + 5, duration);

          audioRef.current.currentTime = newTime;
          setCurrentTime(newTime);
        }
      }

      // Left Arrow -> Backward 5 seconds
      if (event.key === "ArrowLeft") {
        event.preventDefault();

        if (audioRef.current) {
          const newTime = Math.max(audioRef.current.currentTime - 5, 0);

          audioRef.current.currentTime = newTime;
          setCurrentTime(newTime);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    activeTrack,
    isPlaying,
    duration,
    handlePause,
    handlePlayTrack,
    handleClosePlayer,
  ]);

  // --------------------------------------------------
  // CATEGORY STYLE
  // --------------------------------------------------

  const getCategoryStyle = (category) => {
    return (
      CATEGORY_STYLES[category] || {
        icon: "🎵",
        bg: "from-indigo-500/15 to-violet-500/10",
        border: "border-indigo-400/20",
      }
    );
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="min-h-full bg-slate-950 text-white">
      {/* HEADER */}
      <section className="border-b border-slate-800/80 bg-slate-900/60">
        <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                <MusicalNoteIcon className="h-3.5 w-3.5" />
                Sound Therapy
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Find your calm.
              </h1>

              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-400 sm:text-sm">
                Use calming sounds to relax, recover, focus, and create a
                peaceful mental environment.
              </p>
            </div>

            {activeTrack && (
              <div
                role="status"
                aria-live="polite"
                className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-[11px] text-indigo-200"
              >
                {isPlaying
                  ? `Playing: ${activeTrack.title}`
                  : `Paused: ${activeTrack.title}`}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* CATEGORIES */}
        <div className="mb-7 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex min-w-max gap-2">
            {CATEGORIES.map((category) => {
              const active = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  aria-pressed={active}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all ${
                    active
                      ? "border-indigo-500/50 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                      : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span>{category.icon}</span>
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ALERTS */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-900/50 bg-red-950/40 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-xs font-medium text-red-300">{error}</p>

            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-800 bg-red-900/30 px-3 py-2 text-xs font-bold text-red-200 transition hover:bg-red-900/60"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Try Again
            </button>
          </div>
        )}

        {audioError && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-amber-800/50 bg-amber-950/30 px-4 py-3 text-xs text-amber-300"
          >
            {audioError}
          </div>
        )}

        {/* TRACK LIST */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-2xl border border-slate-800 bg-slate-900"
              />
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex min-h-75 flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/60 px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl">
              🎵
            </div>

            <h2 className="text-sm font-bold text-white">
              No sounds available
            </h2>

            <p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-500">
              There are currently no sounds in this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tracks.map((track) => {
              const isActive = activeTrack?.id === track.id;

              const style = getCategoryStyle(track.category);

              return (
                <article
                  key={track.id}
                  className={`group relative overflow-hidden rounded-2xl border bg-linear-to-br ${style.bg} ${style.border} bg-slate-900/80 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-600 hover:shadow-xl hover:shadow-black/20`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/5 bg-slate-950/60 text-xl">
                      {style.icon}
                    </div>

                    {isActive && (
                      <span
                        className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-indigo-300"
                        role="status"
                      >
                        {isPlaying ? "Playing" : "Paused"}
                      </span>
                    )}
                  </div>

                  <div className="mt-5">
                    <h2 className="truncate text-sm font-extrabold text-white">
                      {track.title}
                    </h2>

                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {track.category}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlayTrack(track)}
                    disabled={loadingAudio}
                    aria-label={
                      isActive && isPlaying
                        ? `Pause ${track.title}`
                        : `Play ${track.title}`
                    }
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-slate-900 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingAudio && isActive ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                    ) : isActive && isPlaying ? (
                      <>
                        <PauseIcon className="h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <PlayIcon className="h-4 w-4" />
                        Play
                      </>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {/* ACTIVE PLAYER */}
        {activeTrack && (
          <section
            className="sticky bottom-4 z-30 mt-8 overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl shadow-black/60 backdrop-blur-xl"
            aria-label="Sound player"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Audio Therapy Player
                </span>
              </div>

              <button
                type="button"
                onClick={handleClosePlayer}
                aria-label="Close playbar"
                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3 sm:w-1/3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-600/20 text-xl">
                    {getCategoryStyle(activeTrack.category).icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-white">
                      {activeTrack.title}
                    </p>

                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {activeTrack.category}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-center gap-2 sm:w-1/3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isPlaying) {
                        handlePause();
                      } else {
                        handlePlayTrack(activeTrack);
                      }
                    }}
                    aria-label={isPlaying ? "Pause sound" : "Play sound"}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-95"
                  >
                    {isPlaying ? (
                      <PauseIcon className="h-5 w-5" />
                    ) : (
                      <PlayIcon className="h-5 w-5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleStop}
                    aria-label="Stop sound"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white"
                  >
                    <StopIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 sm:w-1/3">
                  <button
                    type="button"
                    onClick={handleMute}
                    aria-label={isMuted ? "Unmute sound" : "Mute sound"}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white"
                  >
                    {isMuted || volume === 0 ? (
                      <SpeakerXMarkIcon className="h-4 w-4" />
                    ) : (
                      <SpeakerWaveIcon className="h-4 w-4" />
                    )}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    aria-label="Volume"
                    className="w-20 cursor-pointer accent-indigo-500 sm:w-24"
                  />

                  <span className="w-8 text-right font-mono text-[10px] text-slate-400">
                    {Math.round((isMuted ? 0 : volume) * 100)}%
                  </span>
                </div>
              </div>

              <div className="mt-1 flex items-center gap-3">
                <span className="w-8 text-right font-mono text-[10px] text-slate-400">
                  {formatTime(currentTime)}
                </span>

                <div className="relative flex flex-1 items-center">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    step="0.1"
                    value={Math.min(currentTime, duration || 0)}
                    onChange={handleSeek}
                    disabled={!duration}
                    aria-label="Sound progress"
                    style={{
                      background: `linear-gradient(to right, #6366f1 ${progressPercentage}%, #334155 ${progressPercentage}%)`,
                    }}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-indigo-400 focus:outline-none disabled:cursor-not-allowed"
                  />
                </div>

                <span className="w-8 font-mono text-[10px] text-slate-400">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* RECENTLY PLAYED */}
        {recentlyPlayed.length > 0 && (
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-white">
                  Recently Played
                </h2>

                <p className="mt-1 text-[10px] text-slate-500">
                  Your latest calming sounds (Saved)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {recentlyPlayed.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => handlePlayTrack(track)}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-left transition hover:border-slate-700 hover:bg-slate-800"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-base">
                    {getCategoryStyle(track.category).icon}
                  </span>

                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold text-slate-200">
                      {track.title}
                    </span>

                    <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      {track.category}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
