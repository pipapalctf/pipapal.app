import React from "react";
import { Award, Medal, Leaf, Heart, Star, Zap, Trash2 } from "lucide-react";

// Custom recycle icon using trash2 as base
export const BadgeIcons = {
  seedling: Leaf,
  saver: Zap,
  environmentalist: Star,
  champion: Medal,
  hero: Heart,
  recycler: Recycle,
};

export function Recycle(props: React.ComponentProps<typeof Trash2>) {
  return (
    <div className="relative" style={{ width: props.size, height: props.size }}>
      <Trash2 {...props} />
      <div
        className="absolute"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(45deg)",
          width: "60%",
          height: "60%"
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width={props.size as number * 0.6}
          height={props.size as number * 0.6}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 3l-8 8 M8 13l8 8" />
        </svg>
      </div>
    </div>
  );
}