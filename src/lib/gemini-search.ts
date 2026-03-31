import { GoogleGenerativeAI } from "@google/generative-ai";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";

interface GeminiGroundingSource {
  title: string;
  url: string;
}

export interface GeminiSearchResult {
  text: string;
  sources: GeminiGroundingSource[];
}

export function isGeminiAvailable(): boolean {
  return GOOGLE_API_KEY.length > 0;
}

export async function searchWithGemini(
  userQuery: string
): Promise<GeminiSearchResult | null> {
  if (!isGeminiAvailable()) return null;

  try {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      tools: [{ googleSearch: {} } as never],
    });

    const result = await model.generateContent(
      `한국 식품안전 관련 최신 정보를 검색해주세요. 구체적인 사건명, 날짜, 장소, 관련 기관을 포함하여 답변하세요: ${userQuery}`
    );

    const response = result.response;
    const text = response.text() || "";

    // grounding metadata에서 출처 추출
    const candidate = response.candidates?.[0];
    const metadata = candidate?.groundingMetadata;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chunks = (metadata as any)?.groundingChunks as
      | Array<{ web?: { title?: string; uri?: string } }>
      | undefined;

    const sources: GeminiGroundingSource[] = (chunks || [])
      .filter((chunk) => chunk.web)
      .map((chunk) => ({
        title: chunk.web?.title || "",
        url: chunk.web?.uri || "",
      }))
      .slice(0, 5);

    return { text, sources };
  } catch (error) {
    console.error(
      "Gemini search error:",
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}
