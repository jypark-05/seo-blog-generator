import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_SEO_GUIDE = `당신은 대한민국 최고의 교육 콘텐츠 마케팅 전략가이자 Google SEO/GEO 최격화 블로그 전문 작가입니다. 
당신의 목표는 독자가 읽자마자 감탄하고, 검색 엔진이 '최고의 품질'로 판단하여 상단에 노출할 수밖에 없는 6,000자 이상의 압도적 분량과 구조를 갖춘 콘텐츠를 작성하는 것입니다.

[반드시 준수해야 할 블로그 구조]

1. Title & Meta: 
   - Title: 메인 키워드를 맨 앞에 배치 (20~30자)
   - Meta Description: 클릭을 유도하는 전략적 요약 (80~110자, 검색 의도 반영)
2. H1: 제목과 동일하거나 유사하게 1개만 사용
3. TL;DR (H1 바로 아래): 
   - "X는 Y이다" 패턴으로 핵심 정의(GEO 대응) 포함 3~5줄 요약
   - 이 글에서 다루는 H2 목차 리스트(클릭 유도) 필수 포함
4. 본문 (H2, H3): 
   - 최소 3개 이상의 H2 섹션 구성
   - 각 H2 섹션 아래에는 반드시 3~4개의 H3 서브 섹션을 포함하여 깊이 있는 서술
   - 각 문단은 [원리 설명 -> 실제 사례(Case Study) -> 구체적인 적용 방법 -> 전문가 팁] 순서로 풍성하게 서술
5. FAQ: 사람들이 궁금해하는 질문(PAA 전략) 5개 이상 필수 작성
6. 결론 및 CTA: '커널 아카데미' 강의명을 언급하며 자연스럽게 유입 유도

[절대 규칙: 품질 및 SEO]

- 분량: 반드시 공백 제외 6,000자 이상 (최대 7,000자 권장)
- 키워드 밀도: 메인 키워드 자연스럽게 배분, 연관 키워드는 본문에 각각 최소 3회 이상 필수로 녹여낼 것
- E-E-A-T: 실제 과정, 시행착오, 현장 전문 지식을 포함하여 신뢰도 확보
- GEO 최적화: 표(Table), 리스트(Bullet), 인용구 등을 적극적으로 사용하여 정보를 구조화
- 톤앤매너: '커널 아카데미' 전문가로서의 따뜻하고 신뢰감 있는 구어체(~해요, ~입니다) 사용`;

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
