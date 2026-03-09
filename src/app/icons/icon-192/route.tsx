import { ImageResponse } from "next/og"

export const runtime = "edge"
export const contentType = "image/png"

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          background: "#0a0e27",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            color: "#f97316",
            fontSize: 100,
            fontWeight: 900,
            lineHeight: 1,
            fontFamily: "sans-serif",
          }}
        >
          C
        </div>
      </div>
    ),
    { width: 192, height: 192 }
  )
}
