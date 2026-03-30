import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY || "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

const SYSTEM_PROMPT = `당신은 식품안전 전문 AI 어시스턴트 'AI-FX'입니다.

답변 스타일:
- 마크다운 문법(#, **, - 등)을 사용하지 마세요. 일반 대화체로 자연스럽게 답변합니다.
- 친근하고 편안한 톤으로, 전문가가 옆에서 설명해주는 느낌으로 작성합니다.
- 이모지는 사용하지 않습니다.
- 핵심 내용을 먼저 말하고, 필요하면 부연 설명을 덧붙입니다.

답변 범위:
- 아래 참고 자료가 있으면 이를 기반으로 답변합니다.
- 참고 자료에 없는 내용이라도 식품안전/위생/법규에 대한 일반 지식을 활용하여 최대한 도움이 되는 답변을 합니다.
- 수집된 데이터와 일반 지식을 자연스럽게 결합하여 답변합니다.
- 답변에 확신이 없는 부분은 "정확한 내용은 관할 기관에 확인해보시는 것이 좋겠습니다"라고 안내합니다.

답변은 한국어로 작성합니다.`;

async function getQueryEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${VOYAGE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "voyage-3-lite",
      input: [text],
      input_type: "query",
    }),
  });

  if (!response.ok) {
    throw new Error(`Voyage API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function callClaude(
  systemPrompt: string,
  userMessage: string,
  history: { role: string; content: string }[] = []
): Promise<string> {
  const messages = [
    ...history.slice(-6).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (!VOYAGE_API_KEY || !ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API keys not configured" }, { status: 500 });
  }

  const body = await request.json();
  const { message, history } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  try {
    // 1. 질문을 임베딩으로 변환
    const queryEmbedding = await getQueryEmbedding(message);

    // 2. 유사 게시글 검색 (상위 3건 - 비용 절감)
    const { data: matches } = await supabase.rpc("match_articles", {
      query_embedding: queryEmbedding,
      match_threshold: 0.3,
      match_count: 3,
    });

    // 3. 키워드 정보도 조회
    const { data: keywords } = await supabase
      .from("keywords_meta")
      .select("keyword, risk_level, action_guide")
      .limit(20);

    // 4. 컨텍스트 구성
    let context = "";

    if (matches && matches.length > 0) {
      context += "\n\n[참고 게시글]\n";
      for (const match of matches) {
        context += `- [${match.risk_level || "미분류"}] ${match.title} (${match.site_name}, ${match.publish_date})\n`;
        if (match.summary) {
          context += `  요약: ${match.summary.slice(0, 200)}\n`;
        }
      }
    }

    if (keywords && keywords.length > 0) {
      const kwList = keywords.map(
        (k: { keyword: string; risk_level: string }) => `${k.keyword}(${k.risk_level})`
      ).join(", ");
      context += `\n[모니터링 키워드] ${kwList}\n`;
    }

    // 5. Claude 호출 (Haiku - 비용 절감)
    const userPrompt = context
      ? `${context}\n\n사용자 질문: ${message}`
      : `사용자 질문: ${message}`;

    const response = await callClaude(SYSTEM_PROMPT, userPrompt, history || []);

    // 6. 참고 문서 정보
    const sources = (matches || []).map((m: { id: number; title: string; url: string; site_name: string; similarity: number }) => ({
      id: m.id,
      title: m.title,
      url: m.url || "",
      site_name: m.site_name,
      similarity: Math.round(m.similarity * 100),
    }));

    return NextResponse.json({
      response,
      sources,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Chat error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
