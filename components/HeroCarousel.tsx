"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { EnseaSlide } from "@/lib/enseaInfo";

/** Carte flottante qui fait défiler les visuels ENSEA, posée sur le fond géométrique animé d'AuthShell. */
export function HeroCarousel({ slides, intervalMs = 5000 }: { slides: EnseaSlide[]; intervalMs?: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), intervalMs);
    return () => clearInterval(id);
  }, [slides.length, intervalMs]);

  return (
    <div className="relative">
      <div className="relative h-56 w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
        {slides.map((slide, i) => (
          <Image
            key={slide.image}
            src={slide.image}
            alt=""
            fill
            priority={i === 0}
            sizes="480px"
            className={`object-cover transition-opacity duration-1000 ${i === index ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </div>
      <p key={index} className="mt-4 text-sm text-white/80">
        {slides[index].caption}
      </p>
      <div className="mt-3 flex gap-1.5">
        {slides.map((slide, i) => (
          <span
            key={slide.image}
            className={`h-1.5 w-6 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/30"}`}
          />
        ))}
      </div>
    </div>
  );
}
