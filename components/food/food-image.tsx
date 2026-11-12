"use client";

import { Apple } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type FoodImageProps = { src: string | null; name: string; size?: number };

export const FoodImage = ({ src, name, size = 48 }: FoodImageProps) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        aria-hidden
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-foreground/30"
      >
        <Apple className="size-1/2" />
      </span>
    );
  }

  return (
    // Open Food Facts images are small already and their CDN can be slow; loading them
    // directly avoids the Next.js optimizer timing out (504) while waiting for it.
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      unoptimized
      onError={() => setFailed(true)}
      className="shrink-0 rounded-lg bg-white object-contain"
      style={{ width: size, height: size }}
    />
  );
};
