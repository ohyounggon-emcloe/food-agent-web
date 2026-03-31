import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query, useNcloudDb } from "@/lib/ncloud-db";

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY || "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

const SYSTEM_PROMPT = `당신은 식품안전 전문 AI 어시스턴트 'AI-FX'입니다.
식품 제조/유통/급식/외식 업체의 품질관리자와 위생담당자를 돕는 전문가입니다.

답변 스타일:
- 마크다운 문법(#, **, -, 1. 등)을 절대 사용하지 마세요. 줄바꿈과 일반 텍스트만 사용합니다.
- 친근하고 편안한 톤으로, 옆자리 선배가 설명해주는 느낌으로 작성합니다.
- 이모지는 사용하지 않습니다.
- 핵심 답변을 먼저 말하고, 부연 설명을 덧붙입니다.

답변 범위 (매우 중요):
- 아래 [참고 게시글]이 있으면 반드시 해당 내용을 구체적으로 인용하여 답변하세요. 날짜, 기관명, 사건 내용 등 구체적 사실을 포함해야 합니다.
- [참고 게시글]의 내용과 당신이 알고 있는 식품안전 지식을 결합하세요.
- 참고 자료가 부족하거나 없더라도 "정보가 없습니다"라고 하지 마세요. 당신이 아는 관련 지식을 충분히 활용하여 실질적으로 도움이 되는 답변을 하세요.
- 법규, 기준, 절차에 대한 질문은 관련 법령과 기관 정보를 포함하여 상세히 답변하세요.
- 최신 정보의 정확성이 확실하지 않을 때만 "최신 현황은 식약처 홈페이지에서 확인해보시는 것이 좋겠습니다"라고 안내합니다.

답변은 한국어로 작성합니다.`;

async function getQueryEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
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

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
    });
  }

  if (!VOYAGE_API_KEY || !ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "API keys not configured" }), {
      status: 500,
    });
  }

  const body = await request.json();
  const { message, history } = body;

  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400,
    });
  }

  try {
    // 1. 질문에서 핵심 키워드 추출 (조사/어미/일반어 제거)
    const stopWords = new Set([
      "최근", "알려줘", "알려주세요", "뭐야", "뭐에요", "어때", "있어", "없어",
      "해줘", "해주세요", "보여줘", "보여주세요", "관련", "대해", "대한",
      "어떤", "어떻게", "무엇", "언제", "어디", "왜", "이번", "지난",
      "현황", "정보", "내용", "사항", "것", "거", "좀", "이", "그", "저",
    ]);
    const keywords = message
      .replace(/[%_?!.,。]/g, "")
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !stopWords.has(w));

    // 임베딩 검색 시작 (병렬)
    const embeddingPromise = getQueryEmbedding(message);

    let textSearchData: Array<{
      id: number;
      title: string;
      url: string;
      site_name: string;
      publish_date: string;
      risk_level: string;
      summary: string;
    }> | null = null;
    let keywordsData: Array<{
      keyword: string;
      risk_level: string;
      action_guide: string;
    }> | null = null;

    if (useNcloudDb()) {
      // 키워드별 OR 조건 생성
      const kwConditions = keywords.length > 0
        ? keywords.map((_, i) => `(title ILIKE $${i + 1} OR summary ILIKE $${i + 1})`).join(" OR ")
        : "FALSE";
      const kwParams = keywords.map((k) => `%${k.replace(/[%_]/g, "")}%`);

      const [queryEmbedding, textSearchResult, keywordsResult] =
        await Promise.all([
          embeddingPromise,
          keywords.length > 0
            ? query<{
                id: number;
                title: string;
                url: string;
                site_name: string;
                publish_date: string;
                risk_level: string;
                summary: string;
              }>(
                `SELECT id, title, url, site_name, publish_date, risk_level, summary
                 FROM collected_info
                 WHERE ${kwConditions}
                 ORDER BY publish_date DESC
                 LIMIT 5`,
                kwParams
              )
            : Promise.resolve([]),
          query<{ keyword: string; risk_level: string; action_guide: string }>(
            "SELECT keyword, risk_level, action_guide FROM keywords_meta LIMIT 20"
          ),
        ]);

      textSearchData = textSearchResult;
      keywordsData = keywordsResult;

      // 2. 임베딩 유사도 검색 (직접 SQL - match_articles RPC 대체)
      const embeddingStr = `[${queryEmbedding.join(",")}]`;
      const embeddingMatches = await query<{
        id: number;
        title: string;
        url: string;
        site_name: string;
        publish_date: string;
        risk_level: string;
        summary: string;
        similarity: number;
      }>(
        `SELECT id, title, url, site_name, publish_date::text, risk_level, summary,
                (1 - (embedding <=> $1::vector))::float AS similarity
         FROM collected_info
         WHERE embedding IS NOT NULL AND 1 - (embedding <=> $1::vector) > $2
         ORDER BY embedding <=> $1::vector
         LIMIT $3`,
        [embeddingStr, 0.25, 5]
      );

      // 3. 두 검색 결과 합치기 (중복 제거)
      const seenIds = new Set<number>();
      const allMatches: Array<{
        id: number;
        title: string;
        url: string;
        site_name: string;
        publish_date: string;
        risk_level: string;
        summary: string;
        similarity: number;
      }> = [];

      for (const m of embeddingMatches || []) {
        if (!seenIds.has(m.id)) {
          seenIds.add(m.id);
          allMatches.push(m);
        }
      }

      for (const m of textSearchData || []) {
        if (!seenIds.has(m.id)) {
          seenIds.add(m.id);
          allMatches.push({ ...m, similarity: 0 });
        }
      }

      // 최대 8건으로 제한
      const matches = allMatches.slice(0, 8);
      const keywords = keywordsData;

      return buildStreamingResponse(matches, keywords, message, history);
    }

    // Fallback: existing Supabase code (키워드별 OR 검색)
    const orFilter = keywords
      .map((k) => {
        const safe = k.replace(/[%_]/g, "");
        return `title.ilike.%${safe}%,summary.ilike.%${safe}%`;
      })
      .join(",");

    const textSearchPromise = keywords.length > 0
      ? supabase
          .from("collected_info")
          .select("id, title, url, site_name, publish_date, risk_level, summary")
          .or(orFilter)
          .order("publish_date", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] });

    const keywordsPromise = supabase
      .from("keywords_meta")
      .select("keyword, risk_level, action_guide")
      .limit(20);

    const [queryEmbedding, textSearchResult, keywordsResult] =
      await Promise.all([embeddingPromise, textSearchPromise, keywordsPromise]);

    // 2. 임베딩 유사도 검색 (상위 5건)
    const { data: embeddingMatches } = await supabase.rpc("match_articles", {
      query_embedding: queryEmbedding,
      match_threshold: 0.25,
      match_count: 5,
    });

    // 3. 두 검색 결과 합치기 (중복 제거)
    const seenIds = new Set<number>();
    const allMatches: Array<{
      id: number;
      title: string;
      url: string;
      site_name: string;
      publish_date: string;
      risk_level: string;
      summary: string;
      similarity: number;
    }> = [];

    for (const m of embeddingMatches || []) {
      if (!seenIds.has(m.id)) {
        seenIds.add(m.id);
        allMatches.push(m);
      }
    }

    for (const m of textSearchResult.data || []) {
      if (!seenIds.has(m.id)) {
        seenIds.add(m.id);
        allMatches.push({ ...m, similarity: 0 });
      }
    }

    // 최대 8건으로 제한
    const matches = allMatches.slice(0, 8);
    const kwMeta = keywordsResult.data;

    return buildStreamingResponse(matches, kwMeta, message, history);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Chat error:", errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), { status: 500 });
  }
}

function buildStreamingResponse(
  matches: Array<{
    id: number;
    title: string;
    url: string;
    site_name: string;
    publish_date: string;
    risk_level: string;
    summary: string;
    similarity: number;
  }>,
  keywords: Array<{
    keyword: string;
    risk_level: string;
    action_guide: string;
  }> | null,
  message: string,
  history: { role: string; content: string }[] | undefined
) {
  // 4. 컨텍스트 구성 (요약 500자로 확대)
  let context = "";

  if (matches.length > 0) {
    context += "\n\n[참고 게시글]\n";
    for (const match of matches) {
      context += `- [${match.risk_level || "미분류"}] ${match.title} (${match.site_name}, ${match.publish_date})\n`;
      if (match.summary) {
        context += `  요약: ${match.summary.slice(0, 500)}\n`;
      }
    }
  }

  if (keywords && keywords.length > 0) {
    const kwList = keywords
      .map(
        (k: { keyword: string; risk_level: string }) =>
          `${k.keyword}(${k.risk_level})`
      )
      .join(", ");
    context += `\n[모니터링 키워드] ${kwList}\n`;
  }

  // 5. Claude 스트리밍 호출
  const messages_for_claude = [
    ...(history || []).slice(-6).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    {
      role: "user" as const,
      content: context
        ? `${context}\n\n사용자 질문: ${message}`
        : `사용자 질문: ${message}`,
    },
  ];

  // 6. SSE 스트리밍 응답 구성
  const sources = matches
    .filter((m) => m.similarity > 0)
    .slice(0, 5)
    .map((m) => ({
      id: m.id,
      title: m.title,
      url: m.url || "",
      site_name: m.site_name,
      similarity: Math.round(m.similarity * 100),
    }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // 먼저 sources를 전송
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`)
      );

      const claudeResponse = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2000,
            system: SYSTEM_PROMPT,
            messages: messages_for_claude,
            stream: true,
          }),
        }
      );

      if (!claudeResponse.ok) {
        const errText = await claudeResponse.text();
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: `Claude API error: ${claudeResponse.status} ${errText}` })}\n\n`
          )
        );
        controller.close();
        return;
      }

      const reader = claudeResponse.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;

            try {
              const event = JSON.parse(jsonStr);
              if (
                event.type === "content_block_delta" &&
                event.delta?.text
              ) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`
                  )
                );
              }
            } catch {
              // JSON 파싱 실패 무시
            }
          }
        }
      } finally {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
