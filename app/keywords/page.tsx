"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";

function KeywordsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [mainKeyword, setMainKeyword] = useState<string | null>(null);
  const [subKeywords, setSubKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        const res = await fetch("/api/keywords", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseName: searchParams.get("courseName"),
            target: searchParams.get("target"),
            topicType: searchParams.get("topicType"),
            usps: [searchParams.get("usp1"), searchParams.get("usp2"), searchParams.get("usp3")]
          })
        });
        const data = await res.json();
        
        if (!res.ok) {
          setErrorMsg(data.error || "API 호출 중 오류가 발생했습니다.");
        } else if (!data.keywords || data.keywords.length === 0) {
          setErrorMsg("키워드를 추출하지 못했습니다. 할당량이 초과되었거나 응답 형식이 지원되지 않습니다.");
        } else {
          setKeywords(data.keywords);
        }
      } catch (error) {
        console.error(error);
        setErrorMsg("서버와의 통신에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    if (searchParams.get("courseName")) fetchKeywords();
  }, [searchParams]);

  const toggleKeyword = (kw: string) => {
    if (mainKeyword === kw) {
      setMainKeyword(null);
    } else if (subKeywords.includes(kw)) {
      setSubKeywords(subKeywords.filter(k => k !== kw));
    } else if (!mainKeyword) {
      setMainKeyword(kw);
    } else if (subKeywords.length < 3) {
      setSubKeywords([...subKeywords, kw]);
    }
  };

  const handleNext = async () => {
    if (!mainKeyword || subKeywords.length !== 3) return;
    setLoadingRelated(true);
    
    let relatedKw = "";
    try {
      const res = await fetch("/api/related", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mainKeyword })
      });
      const data = await res.json();
      if (data.relatedKeywords && data.relatedKeywords.length > 0) {
        relatedKw = data.relatedKeywords.join(",");
      }
    } catch(e) {
      console.error(e);
    }
    
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set("mainKeyword", mainKeyword);
    currentParams.set("subKeywords", subKeywords.join(","));
    if (relatedKw) currentParams.set("relatedKeywords", relatedKw);
    
    router.push(`/topics?${currentParams.toString()}`);
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-3 text-white">키워드 선택</h1>
        <p className="text-gray-400 text-sm">과정 적합성과 트래픽 기반 최상위 추천 키워드입니다.<br/><span className="text-[#3182f6] font-bold">메인 키워드 1개</span>와 <span className="text-teal-400 font-bold">서브 키워드 3개</span>를 순서대로 골라주세요.</p>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-48 space-y-4">
          <div className="w-10 h-10 border-4 border-[#1c1c1e] border-t-[#3182f6] rounded-full animate-spin"></div>
          <p className="text-sm text-gray-400 font-medium">데이터 분석 중...</p>
        </div>
      ) : errorMsg ? (
        <div className="text-[#ff453a] font-medium text-center p-6 border border-[#ff453a]/30 rounded-2xl bg-[#ff453a]/10 mb-8">
          ⚠️ {errorMsg}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
          {keywords.map((kw, idx) => {
             const isMain = mainKeyword === kw;
             const isSub = subKeywords.includes(kw);
             
             let styling = 'bg-[#1c1c1e] border-white/5 text-gray-300 hover:bg-[#2c2c2e] hover:border-white/10';
             let badge = null;
             
             if (isMain) {
               styling = 'bg-[#3182f6]/20 border-[#3182f6] text-[#3182f6] font-semibold shadow-[0_4px_20px_rgba(49,130,246,0.15)] ring-1 ring-[#3182f6]/50';
               badge = <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-[#3182f6] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">MAIN</div>;
             } else if (isSub) {
               styling = 'bg-teal-500/10 border-teal-500/50 text-teal-400 font-semibold ring-1 ring-teal-500/30';
               badge = <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">SUB</div>;
             }

             return (
               <div 
                 key={idx} 
                 onClick={() => toggleKeyword(kw)}
                 className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.97] flex items-center justify-center border select-none ${styling}`}
               >
                 {badge}
                 <span className="text-center text-[14px] break-keep">{kw}</span>
               </div>
             )
          })}
        </div>
      )}

      <div className="flex justify-center">
        <button 
          onClick={handleNext} 
          disabled={!mainKeyword || subKeywords.length !== 3 || loading || loadingRelated}
          className={`w-full max-w-sm py-4 rounded-[20px] font-bold text-[15px] transition-all flex justify-center items-center gap-2
            ${(mainKeyword && subKeywords.length === 3)
              ? 'bg-[#3182f6] text-white hover:bg-[#1b64da] active:scale-[0.98] shadow-[0_8px_30px_rgba(49,130,246,0.3)]' 
              : 'bg-[#1c1c1e] text-gray-600 cursor-not-allowed border border-white/5'}`}
        >
          {loadingRelated ? "연관 검색어 분석 중..." : "주제 기획하기"}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}

export default function KeywordsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-black">
      <ProgressBar step={2} />
      <Suspense fallback={<div className="p-10 text-center text-gray-500">로딩 중...</div>}>
         <KeywordsContent />
      </Suspense>
    </main>
  );
}
