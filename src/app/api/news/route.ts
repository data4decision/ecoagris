import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = "pub_d7159d6c478649d7a09ac11e573c6bfc";
    const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&q=Ecowas%20Agriculture%20New`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Failed to fetch news");
    }

    const data = await res.json();

    // NewsData.io returns results in "results" array
    const articles = data?.results?.map((item: any) => ({
      title: item.title,
      link: item.link,
      description: item.description,
      image_url: item.image_url,
      pubDate: item.pubDate,
      source: item.source_id,
    })) || [];

    return NextResponse.json({ results: articles });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
