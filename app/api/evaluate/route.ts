import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { content, mainKeyword } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'placeholder') {
      return NextResponse.json({
        "c1": true, "c2": true, "c3": true, "c4": true, "c5": true, "c6": true,
        "c7": content.length >= 5000, "c8": true, "c9": true, "c10": true,
        "c11": true, "c12": true, "c13": true, "c14": true, "c15": true,
        "c16": true, "c17": true, "c18": true, "c19": true
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
    
    const prompt = `
당신은 완성된 블로그 글이 주어진 SEO 및 E-E-A-T 가이드라인을 잘 지켰는지 꼼꼼하게 평가하는 전문 검수자입니다.
아래 블로그 "본문"과 "메인 키워드"를 읽고, 19가지 점검 기준을 충족했는지 (true/false)로만 평가하여 순수한 JSON 객체(Object) 형태로 반환하세요.
반드시 마크다운 백틱(\`\`\`) 없이, 오로지 JSON 데이터만 출력해야 합니다.

[메인 키워드]: ${mainKeyword}

[검수할 본문]:
${content}

[평가 기준 19개 (JSON Key 매핑)]
c1: Title Tag 영역에 핵심 키워드가 1회 포함되었는가? (제목이나 H1 기준)
c2: Title 길이가 공백 포함 20~40자 이내인가? (제목이나 H1 기준)
c3: Meta Description(요약 문장)이 존재하고 검색 의도가 설명되었는가? (글 최상단 요약)
c4: TL;DR: H1 바로 아래 요약되어 있는가?
c5: 단정형 문장: "~이다", "~합니다" 등으로 끝나는 정보성 문장이 적극 사용되었는가? (로봇같은 어투 제외)
c6: 질문형 키워드: 실제 검색 의도를 묻는 질문(FAQ 등)이 반영되었는가?
c7: 글자 수: 공백 포함 5,000자 이상인가? (현재 약 ${content.length}자로 참고하여 판단)
c8: 문단 구조: 적절한 단락 나누기와 리스트형 마크다운(-, 1.)이 원활히 사용되었는가?
c9: 정의 문장: "~란 무엇인가" 형태의 기본 개념 설명이 포함되었는가?
c10: FAQ: 최소 2개 이상의 Q&A 항목이 존재하는가?
c11: H1 존재: 본문 내 H1(# ) 태그가 1개만 존재하는가?
c12: H1 내용: H1(# )에 핵심 키워드가 잘 포함되었는가?
c13: H2 개수: 본문 내 H2(## ) 서브클래스 개수가 2~3개인가? (FAQ 제외)
c14: H2 구조: 논리적 흐름(개념->특징->가이드 등) 구조가 자연스럽게 지켜졌는가?
c15: 체험/경험(Experience): 실제 사례, 경험, 과정이 문맥에 포함되었는가?
c16: 전문성(Expertise 1): 정의 → 원리 → 적용 → 주의사항 흐름으로 서술되었는가?
c17: 전문성(Expertise 2): 작성자 또는 브랜드 정보가 명확한가? (예: 커널 아카데미 등 언급)
c18: 권위(Authoritativeness): 동일 주제 콘텐츠나 내부 링크(수강 안내 등)로 자연스럽게 연결되었는가?
c19: 신뢰성(Trustworthiness): 최신 정보 기준으로 명확히 작성되었거나, 사실 관계가 명확한가?

반드시 아래와 같은 형태의 순수 JSON 객체 포맷으로만 응답하세요:
{
  "c1": true,
  "c2": false,
  "c3": true,
  "c4": true,
  "c5": true,
  "c6": true,
  "c7": true,
  "c8": true,
  "c9": true,
  "c10": true,
  "c11": true,
  "c12": true,
  "c13": true,
  "c14": true,
  "c15": true,
  "c16": true,
  "c17": true,
  "c18": true,
  "c19": true
}
`;

    const result = await model.generateContent(prompt);
    let output = result.response.text();
    output = output.replace(/^[\s\S]*?\{/, '{').replace(/\}[\s\S]*?$/, '}');
    
    const parsed = JSON.parse(output);
    return NextResponse.json(parsed);

  } catch (error) {
    console.error("Evaluate API Error:", error);
    return NextResponse.json({ error: "Failed to evaluate" }, { status: 500 });
  }
}
