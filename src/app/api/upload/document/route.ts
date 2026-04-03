import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = "/var/uploads/documents";

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
    const docType = formData.get("docType") as string;
    const docName = formData.get("docName") as string || "";

    if (!file || !storeId || !docType) {
      return NextResponse.json({ error: "file, storeId, docType 필수" }, { status: 400 });
    }

    // 파일 타입 검증 (이미지 또는 PDF)
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "이미지 또는 PDF만 업로드 가능" }, { status: 400 });
    }

    // 파일 크기 제한 (20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "파일 크기 20MB 초과" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${randomUUID()}.${ext}`;
    const dirPath = path.join(UPLOAD_DIR, storeId, docType);
    const filePath = path.join(dirPath, fileName);

    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const fileUrl = `/api/files/documents/${storeId}/${docType}/${fileName}`;

    return NextResponse.json({
      url: fileUrl,
      fileName,
      docType,
      docName,
      size: file.size,
    });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json({ error: "업로드 실패" }, { status: 500 });
  }
}
