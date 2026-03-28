"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";

const SEO_CHECKLIST = [
  { id: 'c1', category: '기본 메타/타이틀', text: 'Title Tag: 핵심 키워드 1회 포함' },
  { id: 'c2', category: '기본 메타/타이틀', text: 'Title 길이: 20~40자' },
  { id: 'c3', category: '기본 메타/타이틀', text: 'Meta Description: 요약 문장 존재, 검색 의도 설명됨' },
  { id: 'c4', category: '본문 구조(상단)', text: 'TL;DR: H1 바로 아래 요약' },
  { id: 'c5', category: '본문 구조(상단)', text: '단정형 문장: “~이다” 형태' },
  { id: 'c6', category: '본문 구조(상단)', text: '질문형 키워드: 실제 검색 질문 반영' },
  { id: 'c7', category: '분량/형식', text: '글자 수: 5,000자 이상' },
  { id: 'c8', category: '분량/형식', text: '문단 구조: 문단/리스트 적절' },
  { id: 'c9', category: '분량/형식', text: '정의 문장: “~란 무엇인가” 포함' },
  { id: 'c10', category: '본문 구조(하단)', text: 'FAQ: 최소 2개 이상' },
  { id: 'c11', category: '태그 구조', text: 'H1 존재: 1개만 존재' },
  { id: 'c12', category: '태그 구조', text: 'H1 내용: 핵심 키워드 포함' },
  { id: 'c13', category: '태그 구조', text: 'H2 개수: 2~3개 사용' },
  { id: 'c14', category: '태그 구조', text: 'H2 구조: 논리적 흐름 유지' },
  { id: 'c15', category: 'E-E-A-T 요건', text: 'Experience: 실제 사례, 경험, 과정이 포함되었는가?' },
  { id: 'c16', category: 'E-E-A-T 요건', text: 'Expertise(1): 정의 → 원리 → 적용 → 주의사항 구조인가?' },
  { id: 'c17', category: 'E-E-A-T 요건', text: 'Expertise(2): 작성자 또는 브랜드 정보가 명확한가?' },
  { id: 'c18', category: 'E-E-A-T 요건', text: 'Authoritativeness: 동일 주제 콘텐츠와 내부 링크로 연결되었는가?' },
  { id: 'c19', category: 'E-E-A-T 요건', text: 'Trustworthiness: 최신 정보 기준으로 작성/수정되었는가?' },
];

const groupedChecklist = SEO_CHECKLIST.reduce((acc, item) => {
  if (!acc[item.category]) acc[item.category] = [];
  acc[item.category].push(item);
  return acc;
}, {} as Record<string, typeof SEO_CHECKLIST>);

function EditorContent() {
  const searchParams = useSearchParams();
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [done, setDone] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const courseName = searchParams.get("courseName") || "";
  const target = searchParams.get("target") || "";
  const usps = [searchParams.get("usp1"), searchParams.get("usp2"), searchParams.get("usp3")];
  const topicTitle = searchParams.get("topicTitle") || "";
  const topicDirection = searchParams.get("topicDirection") || "";
  const topicHook = searchParams.get("topicHook") || "";

  const mainKeyword = searchParams.get("mainKeyword") || "";
  const subKeywords = searchParams.get("subKeywords")?.split(",") || [];
  const relatedKeywords = searchParams.get("relatedKeywords")?.split(",") || [];

  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current || !topicTitle) return;
    hasStarted.current = true;
    generateContent();
  }, [topicTitle]);

  const generateContent = async () => {
    setIsGenerating(true);
    setIsEvaluating(false);
    setDone(false);
    setContent("");
    setCheckedItems({});

    let generatedText = "";

    try {
      const seoGuide = localStorage.getItem("seoGuide") || "";

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mainKeyword,
          subKeywords,
          relatedKeywords,
          selectedTopic: { title: topicTitle, direction: topicDirection, hook: topicHook },
          lectureInfo: courseName,
          usps,
          target,
          seoGuide
        })
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { value, done: doneReading } = await reader.read();
        if (doneReading) break;
        const chunk = decoder.decode(value, { stream: true });
        generatedText += chunk;
        setContent(generatedText);
      }
    } catch (error) {
      console.error(error);
      setContent("글 생성 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setIsGenerating(false);
      setDone(true);
      return;
    } 

    setIsGenerating(false);
    
    // --- Start AI Evaluation ---
    setIsEvaluating(true);
    try {
      const evalRes = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: generatedText, mainKeyword })
      });
      if (evalRes.ok) {
        const evalData = await evalRes.json();
        if (!evalData.error) {
          setCheckedItems(evalData);
        }
      }
    } catch (evalErr) {
      console.error("Evaluation failed", evalErr);
    } finally {
      setIsEvaluating(false);
      setDone(true);
    }
  };

  const charCount = content.length;
  const mainKeywordIncluded = mainKeyword ? content.includes(mainKeyword) : false;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    alert("클립보드에 복사되었습니다!");
  };

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
      <div className="flex flex-col md:flex-row gap-6 h-full min-h-[700px]">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-[#1c1c1e] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl relative">
          <div className="px-8 py-5 border-b border-white/5 bg-white/5 flex justify-between items-center backdrop-blur-md">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white mb-0.5">블로그 에디터</h1>
              <p className="text-[11px] text-gray-400 font-medium">마크다운 형식을 지원합니다.</p>
            </div>
            <button
              onClick={copyToClipboard}
              disabled={!done}
              className={`px-5 py-2.5 rounded-[18px] font-bold text-[13px] transition-all flex items-center gap-2
                ${done ? 'bg-[#3182f6] text-white hover:bg-[#1b64da] active:scale-95 shadow-[0_4px_15px_rgba(49,130,246,0.25)]' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              복사하기
            </button>
          </div>

          {isGenerating && (
            <div className="absolute top-[76px] left-0 w-full h-[2px] bg-[#1c1c1e] z-10 overflow-hidden">
              <div className="h-full bg-[#3182f6] w-1/3 animate-[slide_1.5s_ease-in-out_infinite]" style={{ animationName: 'slide' }}></div>
            </div>
          )}

          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes slide {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(300%); }
            }
          `}} />

          <textarea
            className="w-full flex-1 p-8 bg-transparent text-[#f5f5f7] outline-none resize-none font-sans text-[15px] leading-relaxed placeholder-gray-600"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="AI가 블로그 내용을 작성하고 있습니다..."
          />
        </div>

        {/* Sidebar Info */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          <div className="bg-[#1c1c1e] border border-white/5 rounded-[32px] p-7 shadow-xl">
            <h3 className="font-bold text-[15px] mb-6 text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#3182f6]" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              생성 현황
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-white/5 pb-4">
                <p className="text-[13px] font-medium text-gray-500">상태</p>
                <p className="text-[14px] font-bold">
                  {isGenerating ? <span className="text-[#3182f6] animate-pulse">본문 생성 중...</span> : 
                   isEvaluating ? <span className="text-orange-400 animate-pulse">AI 검수 중...</span> : 
                   done ? <span className="text-[#30d158]">작성 및 검수 완료</span> : 
                   <span className="text-gray-400">대기 중</span>}
                </p>
              </div>

              <div className="flex justify-between items-end border-b border-white/5 pb-4">
                <p className="text-[13px] font-medium text-gray-500">글자 수</p>
                <p className="text-2xl font-bold tracking-tight text-white">{charCount.toLocaleString()}</p>
              </div>

              <div>
                <p className="text-[13px] font-medium text-gray-500 mb-3 block">메인 키워드 최적화</p>
                <div className="bg-[#2c2c2e] p-3.5 rounded-2xl border border-white/5 space-y-3">
                  <p className="text-[14px] font-bold text-white truncate">{mainKeyword || "입력 없음"}</p>
                  <div className="flex items-center">
                    {mainKeywordIncluded ? (
                      <span className="text-[12px] font-bold text-[#30d158] bg-[#30d158]/10 px-2.5 py-1 rounded-full border border-[#30d158]/20 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        성공적으로 삽입됨
                      </span>
                    ) : (
                      <span className="text-[12px] font-bold text-[#ff453a] bg-[#ff453a]/10 px-2.5 py-1 rounded-full border border-[#ff453a]/20 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        아직 감지되지 않음
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {subKeywords.length > 0 && (
                <div>
                  <p className="text-[13px] font-medium text-gray-500 mb-3 block">서브 키워드 최적화</p>
                  <div className="flex flex-wrap gap-2">
                    {subKeywords.map((kw, i) => {
                      const included = content.includes(kw);
                      return (
                        <span key={i} className={`text-[12px] font-bold px-3 py-1.5 rounded-full transition-colors ${included ? 'text-[#30d158] bg-[#30d158]/10 border border-[#30d158]/20' : 'text-gray-400 bg-white/5 border border-white/5'}`}>
                          {kw}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {relatedKeywords.length > 0 && (
                 <div>
                   <p className="text-[13px] font-medium text-gray-500 mb-3 block">연관 검색어 최적화 (3회 이상)</p>
                   <div className="flex flex-wrap gap-2">
                     {relatedKeywords.map((kw, i) => {
                       const count = (content.match(new RegExp(kw, 'g')) || []).length;
                       const pass = count >= 3;
                       return (
                         <span key={i} className={`text-[12px] font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 ${pass ? 'text-[#30d158] bg-[#30d158]/10 border border-[#30d158]/20' : count > 0 ? 'text-orange-400 bg-orange-400/10 border border-orange-400/20' : 'text-gray-400 bg-white/5 border border-white/5'}`}>
                           {kw} <span className="text-[10px] ml-1 bg-black/20 px-1.5 py-0.5 rounded-md">{count}</span>
                         </span>
                       );
                     })}
                   </div>
                 </div>
               )}
            </div>
          </div>

          <div className="bg-[#1c1c1e] border border-white/5 rounded-[32px] p-6 mt-auto">
            <button
              onClick={generateContent}
              disabled={isGenerating || isEvaluating}
              className={`w-full py-4 rounded-[20px] font-bold text-[14px] transition-all active:scale-[0.98]
                 ${(isGenerating || isEvaluating) ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-white/10 text-white hover:bg-white/20 hover:shadow-lg'}`}
            >
              새로 생성하기
            </button>
          </div>
        </div>
      </div>

      {/* SEO Checklist Area (검수 중이거나 완료 시 표시) */}
      {(isEvaluating || done) && (
        <div className="mt-8 bg-[#1c1c1e] border border-white/5 rounded-[32px] p-8 shadow-2xl animate-[fadeIn_0.5s_ease-out]">
          <div className="mb-8 flex items-end justify-between border-b border-white/5 pb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                {isEvaluating ? (
                  <div className="w-6 h-6 border-2 border-[#3182f6] border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#3182f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {isEvaluating ? 'AI가 SEO 가이드라인 준수 여부를 검토 중입니다...' : 'SEO 가이드라인 최종 체크리스트'}
              </h2>
              <p className="text-[13px] text-gray-400 mt-2 ml-9">
                {isEvaluating ? '작성된 글의 논리 구조와 E-E-A-T 요건 등을 평가하고 있습니다. (약 10~15초 소요)' : 'AI가 요건을 직접 분석하여 자체 평가한 가이드라인 준수 결과입니다.'}
              </p>
            </div>
            {!isEvaluating && (
              <div className="bg-[#2c2c2e] px-5 py-2.5 rounded-2xl border border-white/10 text-[14px] font-bold flex items-center gap-3">
                <span className="text-gray-400">통과 항목</span>
                <span className="text-[16px] text-[#3182f6] tracking-tight">{Object.values(checkedItems).filter(Boolean).length} <span className="text-gray-500 text-[13px]">/ {SEO_CHECKLIST.length}</span></span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(groupedChecklist).map(([category, items]) => (
              <div key={category} className="bg-white/[0.02] border border-white/5 rounded-[24px] p-5 hover:bg-white/[0.04] transition-colors relative overflow-hidden">
                {isEvaluating && <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] z-10"></div>}
                <h3 className="font-bold text-[14px] text-white mb-5 flex items-center gap-2 px-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${isEvaluating ? 'bg-gray-500 animate-pulse' : 'bg-[#3182f6]'}`}></div>
                  {category}
                </h3>
                <div className="space-y-4 px-1">
                  {items.map(item => {
                    const isChecked = !!checkedItems[item.id];
                    return (
                      <div key={item.id} className="flex items-start gap-3 relative">
                        <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-[6px] border flex items-center justify-center transition-all duration-300
                          ${isEvaluating ? 'border-gray-700 bg-black/20' : isChecked ? 'bg-[#3182f6] border-[#3182f6]' : 'border-red-500/50 bg-red-500/10'}`}>
                          {isEvaluating ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-ping"></div>
                          ) : isChecked ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-[13px] leading-relaxed transition-all duration-300 select-none
                          ${isEvaluating ? 'text-gray-500' : isChecked ? 'text-gray-300' : 'text-red-400/90 font-medium'}`}>
                          {item.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditorPage() {
  return (
    <main className="min-h-screen flex flex-col bg-black">
      <ProgressBar step={4} />
      <Suspense fallback={<div className="p-10 text-center text-gray-500">로딩 중...</div>}>
        <EditorContent />
      </Suspense>
    </main>
  );
}
