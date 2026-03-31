const NAVER_CLIENT_ID = process.env.NAVER_SEARCH_CLIENT_ID || "";
const NAVER_CLIENT_SECRET = process.env.NAVER_SEARCH_CLIENT_SECRET || "";

interface NaverNewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
}

export interface WebSearchResult {
  text: string;
  sources: { title: string; url: string }[];
}

export function isWebSearchAvailable(): boolean {
  return NAVER_CLIENT_ID.length > 0 && NAVER_CLIENT_SECRET.length > 0;
}

// HTML 태그 제거
const stripHtml = (s: string) =>
  s.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ");

/**
 * 검색 결과가 질문의 키워드와 관련 있는지 판단.
 * 제목+설명에 검색 키워드 중 하나라도 포함되면 관련 있음.
 */
function isRelevant(
  item: NaverNewsItem,
  searchTerms: string[]
): boolean {
  const combined = stripHtml(
    `${item.title} ${item.description}`
  ).toLowerCase();

  return searchTerms.some((term) => combined.includes(term.toLowerCase()));
}

export async function searchWeb(
  userQuery: string,
  searchTerms?: string[]
): Promise<WebSearchResult | null> {
  if (!isWebSearchAvailable()) return null;

  try {
    const query = encodeURIComponent(userQuery);
    // 넉넉하게 10건 가져온 후 필터링
    const res = await fetch(
      `https://openapi.naver.com/v1/search/news.json?query=${query}&display=10&sort=date`,
      {
        headers: {
          "X-Naver-Client-Id": NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
        },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const allItems: NaverNewsItem[] = data.items || [];

    // 키워드 기반 관련성 필터링
    const terms = searchTerms && searchTerms.length > 0
      ? searchTerms
      : userQuery.split(/\s+/).filter((w) => w.length >= 2);

    const items = allItems.filter((item) => isRelevant(item, terms)).slice(0, 5);

    if (items.length === 0) return null;

    const text = items
      .map(
        (item, i) =>
          `${i + 1}. ${stripHtml(item.title)} (${item.pubDate.slice(0, 16)})\n   ${stripHtml(item.description)}`
      )
      .join("\n\n");

    const sources = items.map((item) => ({
      title: stripHtml(item.title),
      url: item.link,
    }));

    return { text, sources };
  } catch (error) {
    console.error(
      "Naver search error:",
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}
