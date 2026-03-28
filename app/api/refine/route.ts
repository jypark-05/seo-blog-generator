import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { content, taskText, mainKeyword } = await req.json();

    if (!content || !taskText) {
      return NextResponse.json({ error: "본문 또는 수정 요청 사항이 없습니다." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "placeholder") {
      return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

    const prompt = `
당신은 블로그 SEO 전문가입니다. 
아래의 [현재 본문]을 검토하고, [미달된 SEO 항목]을 완벽하게 충족하도록 본문을 수정해주세요.

[현재 본문]
${content}

[미달된 SEO 항목]
${taskText}

[수정 지침]
1. 기존 본문의 흐름과 톤앤매너(~해요, ~입니다)를 유지하세요.
2. 미달된 항목(예: 키워드 부족, 분량 부족, 구조 미흡 등)을 해결하기 위해 필요한 내용을 추가하거나 수정하세요.
3. 메인 키워드("${mainKeyword}")가 자연스럽게 포함되어야 합니다.
4. 수정된 **전체 본문**을 마크다운 형식으로 반환하세요. 다른 설명은 하지 마세요.
`;

    const result = await model.generateContent(prompt);
    const updatedContent = result.response.text();

    return NextResponse.json({ updatedContent });
  } catch (error: any) {
    console.error("Refine API Error:", error);
    return NextResponse.json({ error: "수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}
