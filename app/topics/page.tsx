"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";

interface Topic {
  title: string;
  direction: string;
  hook: string;
  ctrPoint: string;
}

function TopicsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await fetch("/api/topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             courseName: searchParams.get("courseName"),
             usps: [searchParams.get("usp1"), searchParams.get("usp2"), searchParams.get("usp3")],
             target: searchParams.get("target"),
             topicType: searchParams.get("topicType"),
             mainKeyword: searchParams.get("mainKeyword"),
             subKeywords: searchParams.get("subKeywords")?.split(",") || []
          })
        });
        const data = await res.json();
        
        if (!res.ok) {
          setErrorMsg(data.error || "API 호출 중 오류가 발생했습니다.");
        } else if (!data.topics || data.topics.length === 0) {
          setErrorMsg("주제를 기획하지 못했습니다. 할당량이 초과되었거나 응답 형식이 잘못되었습니다.");
        } else {
          setTopics(data.topics);
        }
      } catch (error) {
        console.error(error);
        setErrorMsg("서버와의 통신에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    if (searchParams.get("mainKeyword")) fetchTopics();
  }, [searchParams]);

  const handleNext = () => {
    if (selectedTopic === null) return;
    const currentParams = new URLSearchParams(searchParams.toString());
    const topic = topics[selectedTopic];
    currentParams.set("topicTitle", topic.title);
    currentParams.set("topicDirection", topic.direction);
    currentParams.set("topicHook", topic.hook);
    currentParams.set("topicCtr", topic.ctrPoint);
    router.push(`/editor?${currentParams.toString()}`);
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-3 text-white">블로그 주제 선택</h1>
        <p className="text-gray-400 text-sm">AI가 기획한 3가지 글의 방향성 중 가장 마음에 드는 것을 선택하세요.</p>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-48 space-y-4">
           <div className="w-10 h-10 border-4 border-[#1c1c1e] border-t-[#3182f6] rounded-full animate-spin"></div>
           <p className="text-sm text-gray-400 font-medium">최고의 주제를 고민 중...</p>
        </div>
      ) : errorMsg ? (
        <div className="text-[#ff453a] font-medium text-center p-6 border border-[#ff453a]/30 rounded-2xl bg-[#ff453a]/10 mb-8">
          ⚠️ {errorMsg}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 mb-12">
          {topics.map((t, idx) => {
             const isSelected = selectedTopic === idx;
             return (
               <div 
                 key={idx} 
                 onClick={() => setSelectedTopic(idx)}
                 className={`relative p-6 rounded-[28px] cursor-pointer transition-all duration-300 active:scale-[0.99] overflow-hidden border
                   ${isSelected 
                     ? 'bg-[#1c1c1e] border-[#3182f6] shadow-[0_8px_30px_rgba(49,130,246,0.15)] ring-1 ring-[#3182f6]' 
                     : 'bg-[#1c1c1e] border-white/5 hover:bg-[#2c2c2e]'}`}
               >
                 {isSelected && (
                   <div className="absolute top-0 left-0 w-1.5 h-full bg-[#3182f6]"></div>
                 )}
                 <div className="pl-2">
                   <div className="flex items-center gap-3 mb-3">
                     <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-gray-300 tracking-wide">
                       OPTION {idx + 1}
                     </span>
                   </div>
                   <h2 className="text-xl font-bold tracking-tight mb-4 break-keep text-white leading-snug">{t.title}</h2>
                   
                   <div className="space-y-3">
                     <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                       <h3 className="text-xs font-semibold text-gray-500 mb-1.5">작성 방향</h3>
                       <p className="text-[14px] text-gray-300 break-keep leading-relaxed">{t.direction}</p>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                         <h3 className="text-xs font-semibold text-gray-500 mb-1.5">도입부 훅 (Hook)</h3>
                         <p className="text-[14px] text-gray-300 break-keep italic">"{t.hook}"</p>
                       </div>
                       <div className="bg-[#3182f6]/10 p-4 rounded-2xl border border-[#3182f6]/20">
                         <h3 className="text-xs font-semibold text-[#3182f6] mb-1.5">핵심 클릭 유도 (CTR Point)</h3>
                         <p className="text-[14px] text-[#3182f6] break-keep font-medium">{t.ctrPoint}</p>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             )
          })}
        </div>
      )}

      <div className="flex justify-center">
        <button 
          onClick={handleNext} 
          disabled={selectedTopic === null || loading}
          className={`w-full max-w-sm py-4 rounded-[20px] font-bold text-[15px] transition-all flex justify-center items-center gap-2
            ${selectedTopic !== null 
              ? 'bg-[#3182f6] text-white hover:bg-[#1b64da] active:scale-[0.98] shadow-[0_8px_30px_rgba(49,130,246,0.3)]' 
              : 'bg-[#1c1c1e] text-gray-600 cursor-not-allowed border border-white/5'}`}
        >
          콘텐츠 생성 시작
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}

export default function TopicsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-black">
      <ProgressBar step={3} />
      <Suspense fallback={<div className="p-10 text-center text-gray-500">로딩 중...</div>}>
         <TopicsContent />
      </Suspense>
    </main>
  );
}
