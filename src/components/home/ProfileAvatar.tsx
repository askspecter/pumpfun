"use client";

import { useState } from "react";

const FALLBACKS = [
  "linear-gradient(135deg,#7cf3ff,#a77bff)",
  "linear-gradient(135deg,#ffb36b,#ff5f9e)",
  "linear-gradient(135deg,#3dffb0,#00b3ff)",
  "linear-gradient(135deg,#fff27a,#ff8a5c)",
  "linear-gradient(135deg,#c7cdff,#6e7bff)",
];

/** A real profile picture, falling back to a gradient initial if it fails to load. */
export function ProfileAvatar({
  src,
  name,
  className = "h-9 w-9",
  rounded = "rounded-full",
}: {
  src: string | null;
  name: string;
  className?: string;
  rounded?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${className} ${rounded} shrink-0 border border-white/10 bg-white/5 object-cover`}
      />
    );
  }
  const code = [...name].reduce((n, ch) => n + ch.charCodeAt(0), 0);
  return (
    <span
      className={`${className} ${rounded} flex shrink-0 items-center justify-center text-sm font-bold text-[#08090a]`}
      style={{ background: FALLBACKS[code % FALLBACKS.length] }}
    >
      {(name || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}
