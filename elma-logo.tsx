import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

export function ElmaLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="100"
      height="100"
      viewBox="-40 -40 80 80"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g transform="scale(1.1) translate(-2, 0)">
        <path
          d="M 18.3,3.2 C 11.4,3.2 7.3,9.5 7.3,16.4 C 7.3,23.3 11.4,31.5 18.3,31.5 C 25.2,31.5 28.3,27.4 28.3,27.4 C 28.3,27.4 31.4,31.5 38.3,31.5 C 45.2,31.5 49.3,23.3 49.3,16.4 C 49.3,9.5 45.2,3.2 38.3,3.2 C 31.4,3.2 28.3,7.3 28.3,7.3 C 28.3,7.3 25.2,3.2 18.3,3.2 Z"
          transform="translate(-28, -15)"
          fill="#D32F2F"
        />
        <path
          d="M 28 2 L 30 2 L 30 -5 L 28 -5 Z"
          transform="translate(-28, -15) rotate(15, 29, 0)"
          fill="#8B4513"
        />
        <path
          d="M 32.3,4.2 C 32.3,4.2 36.2,-2.5 42.3,-2.5 C 48.4,-2.5 48.3,3.2 42.3,4.2 C 36.3,5.2 32.3,4.2 32.3,4.2 Z"
          transform="translate(-28, -15) rotate(25, 38, 0)"
          fill="#4CAF50"
        />
      </g>
    </svg>
  );
}
