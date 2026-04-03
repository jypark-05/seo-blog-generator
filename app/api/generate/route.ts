import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_SEO_GUIDE = `당신은 교육 회사의 Google SEO + GEO 최적화 블로그 전문 작가입니다.
아래 가이드를 반드시 100% 준수하여 블로그 콘텐츠를 작성하세요.

▶ 글 구조 (반드시 이 순서 준수)
1. Title 태그용 제목: 메인 키워드를 제목 앞부분에 배치, 국문 20~30자 이내
2. Meta Description: 전략 키워드 13자 이내 배치, 국문 80~110자
3. H1: Title과 동일하거나 유사, 페이지당 1개 고정
4. TL;DR: H1 바로 아래 2~4문장. "X는 Y이다" 패턴으로 핵심 정의 + 이 글에서 다루는 내용 + 독자가 얻는 것 (GEO 최우선 인용 영역). 본문 H2 제목들을 한 줄씩 리스트업하는 '글 미리보기' 목차 추가
5. H2-1 (개념/정의): 이 주제가 무엇인지 명확하게 정의
6. H2-2 (특징/장점): 핵심 소구 포인트(USP) 3개 자연스럽게 반영
7. H2-3 (해결책/가이드): 타겟 수강생이 당장 실천할 수 있는 Action Item 제시
8. FAQ: 사람들이 가장 많이 묻는 질문 3~4개 (PAA 전략)
9. 결론 및 CTA: 강의명 언급하며 자연스럽게 유입 유도

▶ 키워드 사용 규칙
- 메인 키워드: H1과 TL;DR에 반드시 포함, 본문 전체 밀도 1~2% 유지
- 서브 키워드: H2/H3에 자연스럽게 분산 배치 (본문에 최소 3회 이상 삽입 필수)
- 연관 키워드: 반드시 본문 작성 중 각 연관 키워드를 3번 이상 포함할 것 (문맥에 자연스럽게 녹이기)
- Title에 전략 키워드는 최대 2개, 이상적으로는 1개

▶ 작성 톤앤매너 (반드시 준수)
- 문체: ~해요, ~합니다 (전문적이면서 친근한 톤, 실제 사람이 설명해주는 듯한 부드러운 구어체 사용)
- 금지 표출: "결론적으로", "요약하자면", "오늘은~" 같은 상투적 표현 철저히 배제
- 전문적이지만 쉬운 언어: "효율성이 제고됨" 대신 "업무가 훨씬 가벼워져요"처럼 일상적인 표현을 쓰되 논리적 깊이는 유지
- 공감 기반 서술: "공부하시느라 힘드시죠?", "저도 이 개념을 처음 접했을 때 참 막막했는데요" 등 독자의 마음을 어루만지는 문장을 섞어준다
- 로봇 같은 딱딱한 나열식 문체 절대 금지
- 독자 공감: 타겟 수강생의 고민을 언급하며 공감대 형성 후 해결책 제시 (페르소나 빙의)

▶ 콘텐츠 구성 원칙
- 90% 정보성: 글의 대부분은 메인 키워드에 대한 심도 있는 정보, 방법론, 트렌드 분석으로 채운다. 독자가 "이 블로그 하나로 다 해결됐다"라고 느낄 만큼 유익하게 작성한다.
- 10% 홍보성: 강의 관련 언급은 글의 흐름상 꼭 필요한 경우가 아니면 최하단(마무리 섹션)으로 몰아넣는다. 본문 중간에 노골적인 수강 유도 멘트를 절대 넣지 않는다.

▶ E-E-A-T 기준 준수
- Experience(경험): 실제 과정/시행착오/현장 언어 포함, 일반론만 반복 금지
- Expertise(전문성): 정의→원리→예외→적용 순서로 설명, 오해 포인트/한계까지 언급
- Authoritativeness(권위): 수치/출처/데이터 반드시 포함
- Trust(신뢰): 작성자 표기 "커널 아카데미"

▶ GEO 최적화
- TL;DR 필수 포함 (H1 바로 아래)
- 표/리스트/단계형 구조 적극 활용
- FAQ 섹션 필수 포함
- 구조화된 마크다운 사용

▶ 스키마 마크업 준수사항
- H1: 페이지당 1개 고정, 메인 키워드 앞부분 배치
- H2: 3개 적정 + FAQ H2 추가, 각 H2 아래 H3 2~3개
- H태그와 본문 단락(p)은 반드시 쌍으로 구성
- 이미지 alt태그 제안 시: 핵심 키워드 포함 문장형 작성 (단어 나열 금지)

▶ 분량 및 형식
- 최소 3,000자 이상 (가능하면 3,500~4,000자)
- 마크다운 형식 (# ## ### 사용)
- 가독성: 한 문단은 최대 3~4문장으로 제한, Bullet Point 및 인용구(>) 적극 활용
- 본문 중간 강의 홍보 금지`;

export async function POST(req: Request) {
  try {
    const { mainKeyword, subKeywords, relatedKeywords, selectedTopic, lectureInfo, usps, target, seoGuide } = await req.json();

    const systemPrompt = seoGuide && seoGuide.trim().length > 0 ? seoGuide : DEFAULT_SEO_GUIDE;

    const userPrompt = `
[변수]
- mainKeyword: ${mainKeyword}
- subKeywords: ${subKeywords.join(", ")}
- relatedKeywords: ${(relatedKeywords || []).join(", ")} (지시: 본문에 각 연관 키워드 최소 3번 이상 포함)
- selectedTopic: 제목("${selectedTopic.title}"), 방향성("${selectedTopic.direction}"), 훅("${selectedTopic.hook}")
- lectureInfo: ${lectureInfo}
- usps: 1. ${usps[0]}, 2. ${usps[1]}, 3. ${usps[2]}
- target: ${target}

위 변수들을 바탕으로 최적화된 블로그 글을 작성해주세요.
`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'placeholder') {
      const stream = new ReadableStream({
        async start(controller) {
          const text = "# Mock API Output\n\nThis is a mocked streaming text because the GEMINI_API_KEY is missing or set to placeholder.\n\n" + userPrompt;
          const chunks = text.split("");
          let i = 0;
          const interval = setInterval(() => {
            if (i >= chunks.length) {
              clearInterval(interval);
              controller.close();
            } else {
              controller.enqueue(new TextEncoder().encode(chunks[i]));
              i++;
            }
          }, 10);
        }
      });
      return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: systemPrompt 
    });

    const result = await model.generateContentStream(userPrompt);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
        } catch(e) {
          controller.error(e);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (error) {
    console.error("Generate API Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate content" }), { status: 500 });
  }
}
