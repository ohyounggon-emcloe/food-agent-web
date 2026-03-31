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

export async function searchWeb(
  userQuery: string
): Promise<WebSearchResult | null> {
  if (!isWebSearchAvailable()) return null;

  try {
    const query = encodeURIComponent(userQuery);
    const res = await fetch(
      `https://openapi.naver.com/v1/search/news.json?query=${query}&display=5&sort=date`,
      {
        headers: {
          "X-Naver-Client-Id": NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
        },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const items: NaverNewsItem[] = data.items || [];

    if (items.length === 0) return null;

    // HTML 태그 제거
    const stripHtml = (s: string) => s.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ");

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
