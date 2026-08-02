"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { ENSEA_SLIDES } from "@/lib/enseaInfo";

export function EnseaInfoStrip() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % ENSEA_SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="flex items-center gap-4 p-0">
        <div className="relative h-20 w-28 shrink-0 sm:h-24 sm:w-36">
          {ENSEA_SLIDES.map((slide, i) => (
            <Image
              key={slide.image}
              src={slide.image}
              alt=""
              fill
              sizes="150px"
              className={`object-cover transition-opacity duration-700 ${i === index ? "opacity-100" : "opacity-0"}`}
            />
          ))}
        </div>
        <div className="flex flex-col gap-2 py-3 pr-4">
          <p className="text-sm text-muted-foreground">{ENSEA_SLIDES[index].caption}</p>
          <div className="flex gap-1.5">
            {ENSEA_SLIDES.map((slide, i) => (
              <span
                key={slide.image}
                className={`h-1.5 w-6 rounded-full transition-colors ${i === index ? "bg-secondary" : "bg-border"}`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
