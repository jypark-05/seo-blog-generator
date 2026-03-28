import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { courseName, usps, target, topicType, mainKeyword, subKeywords } = await req.json();
    
    const prompt = `당신은 최상급 콘텐츠 마케터입니다. 기획 중인 블로그 방향: "${topicType || '일반'}", 주제/과정명: "${courseName}", 타겟 고객: "${target}". 
핵심 소구포인트: 1. ${usps[0]} 2. ${usps[1]} 3. ${usps[2]}.
선택된 메인 키워드: "${mainKeyword}", 서브 키워드: ${subKeywords.join(", ")}.

이 정보를 바탕으로 타겟 고객을 확실히 끌어당기고 수강을 유도할 수 있는 매력적인 블로그 주제 3가지를 한국어로 기획해 주세요.
반드시 아래의 속성(key)을 가진 정확한 JSON 배열 형식([])으로만 응답해야 합니다.
"title" (문자열: 사람을 이끄는 블로그 포스팅 제목)
"direction" (문자열: 포스팅을 어떤 방향과 전략으로 쓸 것인지 간략한 설명)
"hook" (문자열: 첫 문장에 들어갈 강력한 주의 끌기(Hook) 문구)
"ctrPoint" (문자열: 수많은 검색 결과 중에서 이 글을 클릭할 수밖에 없는 명확한 이유)

예시:
[
  { "title": "...", "direction": "...", "hook": "...", "ctrPoint": "..." }
]`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'placeholder') {
      return NextResponse.json({ topics: [
        { title: 'Next.js 완벽 가이드: 한 방에 이해하기', direction: '초보자를 위한 단계별 접근 방식', hook: '아직도 React 라우터에서 헤매고 계신가요?', ctrPoint: '전체 인증 및 DB 연동 코드가 포함된 유일한 글' },
        { title: '왜 Next.js가 프론트엔드의 미래인가', direction: 'SSR과 SSG의 장점을 실무 관점에서 풀이', hook: '단순 React 애플리케이션의 로딩 속도, 만족하시나요?', ctrPoint: '데이터 기반의 확실한 성능 개선 수치 제공' },
        { title: 'Next.js 14 App Router 마스터 클래스', direction: 'App Router의 변화와 심화 기능 딥다이브', hook: 'Next.js 13부터 라우팅 방식이 완전히 바뀌었습니다.', ctrPoint: '새로운 라우팅 방식을 직관적인 다이어그램으로 시각화' }
      ] });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview", generationConfig: { responseMimeType: "application/json" } });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let topics = [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        topics = parsed;
      } else if (parsed && Array.isArray(parsed.topics)) {
        topics = parsed.topics;
      }
    } catch (e) {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        topics = JSON.parse(match[0]);
      }
    }
    
    return NextResponse.json({ topics });
  } catch (error: any) {
    console.error("Topics API Error:", error);
    const msg = error?.message || "알 수 없는 오류";
    return NextResponse.json({ error: `주제 생성 실패: ${msg}` }, { status: 500 });
  }
}
