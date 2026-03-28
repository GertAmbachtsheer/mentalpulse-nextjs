import { ApiClient, BibleClient } from "@youversion/platform-core";
import { NextResponse } from "next/server";

const VERSION_ID = 206; // World English Bible (WEB)

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export async function GET() {
  try {
    const apiClient = new ApiClient({
      appKey: process.env.YOUVERSION_API_KEY!,
    });
    const bibleClient = new BibleClient(apiClient);

    const day = getDayOfYear();
    const votd = await bibleClient.getVOTD(day);
    const passage = await bibleClient.getPassage(VERSION_ID, votd.passage_id, "text");

    const url = `https://www.bible.com/bible/${VERSION_ID}/${votd.passage_id}.WEB`;

    return NextResponse.json({
      text: passage.content,
      reference: passage.reference,
      url,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("VOTD fetch error:", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
