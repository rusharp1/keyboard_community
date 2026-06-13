import { ImageResponse } from "next/og";

// 동적 파비콘(32x32) — 다크 배경에 "K". 별도 바이너리 파일 없이 생성.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111418",
          color: "#e6e6e6",
          fontSize: 22,
          fontWeight: 700,
          borderRadius: 6,
        }}
      >
        K
      </div>
    ),
    size,
  );
}
