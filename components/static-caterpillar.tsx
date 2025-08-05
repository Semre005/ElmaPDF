import type { SVGProps } from "react";

export function StaticCaterpillar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="50"
      height="50"
      viewBox="-25 -25 50 50"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
        <g id="caterpillar" fill="hsl(var(--primary))" transform="scale(1.2)">
            <circle cx="-12" cy="0" r="6" />
            <circle cx="-4" cy="3" r="6" />
            <circle cx="4" cy="3" r="6" />
            <circle cx="12" cy="0" r="6" />
            
            <g id="head" transform="translate(12, 0)">
                <circle r="6" />
                <circle cx="-2" cy="-1.5" r="2" fill="white" />
                <circle cx="2" cy="-1.5" r="2" fill="white" />
                <circle cx="-2" cy="-1.8" r="1" fill="black" />
                <circle cx="2" cy="-1.8" r="1" fill="black" />
            </g>
        </g>
    </svg>
  );
}
