import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(to bottom right, #0e7490, #0f766e)",
          borderRadius: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="180"
          height="180"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g
            stroke="#fb923c"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
          >
            <path d="M10 27 C 10.5 22 11 17 12 13" />
            <path d="M12 13 Q 7.5 11.5 4 13" />
            <path d="M12 13 Q 7 9 5 7" />
            <path d="M12 13 Q 10.5 7.5 10 4.5" />
            <path d="M12 13 Q 14.5 8 17 6.5" />
            <path d="M12 13 Q 16 12 18 13.5" />
          </g>
          <polygon points="17,10 24,10 20.5,5" fill="#ffffff" />
          <rect x="17" y="10" width="7" height="16" fill="#ffffff" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
