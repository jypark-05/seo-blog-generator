import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { courseName, usps, target, topicType } = await req.json();
    
    const prompt = `당신은 최상급 SEO 블로그 기획 전문가입니다. 
제가 기획한 강의명은 "${courseName}"이며, 블로그 기획 방향(주제 타입)은 "${topicType}", 핵심 타겟 고객은 "${target}"입니다. 
소구 포인트(USP) 3가지는 다음과 같습니다: 1. ${usps[0]} 2. ${usps[1]} 3. ${usps[2]}. 

위 정보를 바탕으로 타겟 고객이 네이버나 구글에서 검색할 만한 한국어 검색어(메인/서브 키워드 후보)를 정확히 12개 생성해 주세요. 
반드시 "강의 주제와의 매칭 적합성"과 "예상되는 쿼리량(검색 트래픽)"이 가장 높은 순서대로 정렬해야 합니다. 
반드시 문자열로만 이루어진 올바른 JSON 배열 형식(예: ["키워드1", "키워드2"])으로 응답하고, 마크다운(backticks)이나 부가 설명은 절대 넣지 마세요.`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'placeholder') {
      return NextResponse.json({ keywords: ['Next.js 강의', '웹 개발 부트캠프', 'SEO 최적화 방법', 'React 18 배우기', 'App Router 튜토리얼', 'Tailwind CSS 강의', 'TypeScript 실무', '풀스택 SaaS 만들기', 'React Hooks', 'Server Components', 'API Routes', 'Vercel 배포'] });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview", generationConfig: { responseMimeType: "application/json" } });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let keywords = [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        keywords = parsed;
      } else if (parsed && Array.isArray(parsed.keywords)) {
        keywords = parsed.keywords;
      }
    } catch (e) {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        keywords = JSON.parse(match[0]);
      }
    }
    
    return NextResponse.json({ keywords });
  } catch (error: any) {
    console.error("Keywords API Error:", error);
    const msg = error?.message || "알 수 없는 오류";
    return NextResponse.json({ error: `키워드 생성 실패: ${msg}` }, { status: 500 });
  }
}
