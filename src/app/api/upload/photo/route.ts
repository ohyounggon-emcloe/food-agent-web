import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = "/var/uploads/photos";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const storeId = formData.get("storeId") as string;
    const photoType = formData.get("photoType") as string || "general";

    if (!file || !storeId) {
      return NextResponse.json({ error: "file과 storeId는 필수" }, { status: 400 });
    }

    // 파일 타입 검증
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "이미지 파일만 업로드 가능" }, { status: 400 });
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "파일 크기 10MB 초과" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${randomUUID()}.${ext}`;
    const dirPath = path.join(UPLOAD_DIR, storeId, today);
    const filePath = path.join(dirPath, fileName);

    // 디렉토리 생성
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }

    // 파일 저장
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const photoUrl = `/api/files/photos/${storeId}/${today}/${fileName}`;

    return NextResponse.json({
      url: photoUrl,
      fileName,
      photoType,
      size: file.size,
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json({ error: "업로드 실패" }, { status: 500 });
  }
}
