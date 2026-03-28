import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as cheerio from "cheerio";

export async function POST(req: Request) {
  try {
    const { mainKeyword } = await req.json();
    if (!mainKeyword) return NextResponse.json({ error: "Missing mainKeyword" }, { status: 400 });

    let top3: string[] = [];

    // Attempt 1: Crawling Google Search
    try {
      const url = `https://www.google.com/search?q=${encodeURIComponent(mainKeyword)}`;
      const reqConfig = {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      };
      const res = await fetch(url, reqConfig);
      
      if (res.ok) {
        const html = await res.text();
        const $ = cheerio.load(html);

        // Standard related searches often nested in specific generic structures (like a > div.BNeawe)
        $('a div.BNeawe, a > div > div.BNeawe').each((i, el) => {
          const text = $(el).text().trim();
          if (text && text.length > 1 && text.length < 25 && text !== mainKeyword && !top3.includes(text)) {
            top3.push(text);
          }
        });
        
        top3 = top3.filter(k => !k.includes('검색') && !k.includes('결과') && !k.includes('http'));
        // The most relevant related queries are often the last ones found on page
        if (top3.length >= 3) {
          top3 = top3.slice(-3);
        }
      }
    } catch (crawlError) {
      console.error("Crawling Google Failed:", crawlError);
    }

    // Attempt 2: Fallback to Gemini API if crawling returns < 3 elements (e.g., blocked or structure changed)
    if (top3.length < 3) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== 'placeholder') {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview", generationConfig: { responseMimeType: "application/json" } });
        const result = await model.generateContent(`구글 검색 엔진의 연관검색어 기능처럼, "${mainKeyword}" 검색 시 하단에 노출될 법한 사람들이 가장 많이 찾는 실용적인 연관 검색어 3개를 생성해 주세요. 배열 형태(["새키워드1", "새키워드2", "새키워드3"])로 응답하세요.`);
        const response = await result.response;
        const text = response.text();
        
        try {
          const match = text.match(/\[[\s\S]*\]/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (Array.isArray(parsed) && parsed.length >= 3) {
               top3 = parsed.slice(0, 3);
            }
          }
        } catch (e) {
          console.error("Gemini Fallback parsing error", e);
        }
      }
    }

    // Attempt 3: absolute string fallback
    if (top3.length < 3) {
      top3 = [mainKeyword + " 기초", mainKeyword + " 추천", mainKeyword + " 연관"];
    }

    return NextResponse.json({ relatedKeywords: top3 });
  } catch (error: any) {
    console.error("Related Keywords Final Error:", error);
    return NextResponse.json({ relatedKeywords: ["기초", "활용법", "추천"] });
  }
}
