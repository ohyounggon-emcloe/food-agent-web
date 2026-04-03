import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_BASE = "/var/uploads";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
  gif: "image/gif",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filePath = path.join(UPLOAD_BASE, ...segments);

  // 보안: 경로 탈출 방지
  if (!filePath.startsWith(UPLOAD_BASE)) {
    return NextResponse.json({ error: "접근 거부" }, { status: 403 });
  }

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "파일 없음" }, { status: 404 });
  }

  try {
    const buffer = await readFile(filePath);
    const ext = filePath.split(".").pop()?.toLowerCase() || "jpg";
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "파일 읽기 실패" }, { status: 500 });
  }
}
