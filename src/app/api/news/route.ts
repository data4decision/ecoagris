import { NextResponse } from "next/server";

// Define the expected structure of a news article from NewsData.io
interface NewsArticle {
  title: string;
  link: string;
  description: string | null;
  image_url: string | null;
  pubDate: string | null;
  source_id: string | null;
}

// Define the expected API response structure
interface NewsApiResponse {
  results: NewsArticle[];
}

export async function GET() {
  try {
    // Use environment variable for API key
    const apiKey = process.env.NEWSDATA_API_KEY;
    if (!apiKey) {
      throw new Error("NewsData API key is not configured");
    }

    const query = encodeURIComponent("Ecowas Agriculture News");
    const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&q=${query}`;

    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour (ISR)
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch news: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as NewsApiResponse;

    // Validate and map the response
    const articles = (data.results ?? []).map((item) => ({
      title: item.title ?? "Untitled",
      link: item.link ?? "#",
      description: item.description ?? null,
      image_url: item.image_url ?? null,
      pubDate: item.pubDate ?? null,
      source: item.source_id ?? null,
    }));

    return NextResponse.json({ results: articles });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news", results: [] },
      { status: 500 }
    );
  }
}