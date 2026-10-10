"use client";

import { useEffect, useState } from "react";

const trails = [
  {
    name: "Patratu Valley",
    difficulty: "Moderate",
    distance: "Sample route",
    duration: "2–3 hours",
    emoji: "⛰️",
    description: "Explore scenic hills and green landscapes.",
  },
  {
    name: "Ranchi Nature Walk",
    difficulty: "Easy",
    distance: "Sample route",
    duration: "1–2 hours",
    emoji: "🌿",
    description: "A relaxed outdoor experience for beginners.",
  },
  {
    name: "Hundru Falls",
    difficulty: "Challenging",
    distance: "Sample route",
    duration: "2–4 hours",
    emoji: "🌊",
    description: "An adventure-inspired waterfall outing.",
  },
];

export default function TrailExplorer() {
  const [selected, setSelected] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [running]);

  const trail = trails[selected];

  const time = [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");

  return (
    <section className="mx-auto my-12 max-w-6xl px-4">
      <div className="mb-7">
        <p className="text-xs font-bold tracking-[0.25em] text-green-700">
          ELSEWHERE · ADVENTURE SERIES
        </p>

        <h2 className="mt-3 font-serif text-4xl text-stone-900">
          Find your wild.
        </h2>

        <p className="mt-2 max-w-xl text-stone-600">
          Discover outdoor adventures, choose a trail, and start tracking
          your hiking time.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Trail selection */}
        <div className="space-y-3">
          {trails.map((item, index) => (
            <button
              key={item.name}
              onClick={() => {
                setSelected(index);
                setRunning(false);
                setSeconds(0);
              }}
              className={`w-full rounded-2xl border p-5 text-left transition ${
                selected === index
                  ? "border-green-800 bg-green-50 shadow-sm"
                  : "border-stone-200 bg-white hover:border-green-600"
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{item.emoji}</span>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-serif text-xl text-stone-900">
                      {item.name}
                    </h3>

                    {selected === index && (
                      <span className="text-xs font-semibold text-green-800">
                        SELECTED
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-stone-600">
                    {item.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-stone-100 px-3 py-1">
                      {item.difficulty}
                    </span>

                    <span className="rounded-full bg-stone-100 px-3 py-1">
                      {item.duration}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Adventure tracker */}
        <div className="overflow-hidden rounded-3xl bg-[#203d30] text-white">
          <div className="relative flex h-48 flex-col justify-between overflow-hidden bg-[#355e47] p-6">
            <div className="absolute inset-0 opacity-30">
              <svg
                viewBox="0 0 400 200"
                preserveAspectRatio="none"
                className="h-full w-full"
              >
                <path
                  d="M0 170 L90 50 L145 125 L230 20 L400 160 V200 H0Z"
                  fill="#b4c9a7"
                />
                <path
                  d="M0 190 L120 105 L210 160 L310 70 L400 145 V200 H0Z"
                  fill="#172e24"
                />
                <path
                  d="M20 170 Q100 120 155 145 T260 95 T380 115"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeDasharray="7 7"
                />
              </svg>
            </div>

            <span className="relative text-xs tracking-[0.2em] text-green-100">
              YOUR NEXT ADVENTURE
            </span>

            <div className="relative">
              <h3 className="font-serif text-3xl">{trail.name}</h3>
              <p className="mt-1 text-sm text-green-100">
                {trail.difficulty} · Trail preview
              </p>
            </div>
          </div>

          <div className="p-6">
            <p className="text-xs tracking-[0.2em] text-green-200">
              HIKE TIMER
            </p>

            <div className="my-3 font-mono text-5xl tracking-wider">
              {time}
            </div>

            <p className="mb-5 text-sm text-green-100">
              {running
                ? "Your hiking session is in progress."
                : seconds > 0
                  ? "Session paused."
                  : "Ready when you are."}
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setRunning(!running)}
                className="rounded-full bg-[#e8d9b8] px-6 py-3 font-semibold text-[#203d30] transition hover:bg-white"
              >
                {running ? "Ⅱ Pause hike" : "▶ Start hike"}
              </button>

              <button
                onClick={() => {
                  setRunning(false);
                  setSeconds(0);
                }}
                className="rounded-full border border-white/30 px-5 py-3 text-sm hover:bg-white/10"
              >
                Reset
              </button>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-green-100/80">
              Demo mode: illustrative trail preview and elapsed-time tracker.
              GPS navigation, verified routes, and distance tracking are not
              implemented yet.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}