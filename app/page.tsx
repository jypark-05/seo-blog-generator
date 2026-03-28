"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";

export default function Home() {
  const router = useRouter();
  const [courseName, setCourseName] = useState("");
  const [usp1, setUsp1] = useState("");
  const [usp2, setUsp2] = useState("");
  const [usp3, setUsp3] = useState("");
  const [topicType, setTopicType] = useState("유입형 콘텐츠");
  const [target, setTarget] = useState("취업 준비생");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams({
      courseName,
      usp1, usp2, usp3,
      target, topicType
    }).toString();
    router.push(`/keywords?${query}`);
  };

  return (
    <main className="min-h-screen flex flex-col bg-black">
      <ProgressBar step={1} />
      <div className="flex-1 max-w-xl mx-auto w-full px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-3 text-white">블로그 자동화 시작하기</h1>
          <p className="text-gray-400 text-sm">강의 정보와 소구 포인트를 입력하면 AI가 완벽한 글을 기획해 드립니다.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#1c1c1e] p-7 rounded-[32px] space-y-6 bg-opacity-70 backdrop-blur-3xl shadow-2xl border border-white/5">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300 ml-1">강의명</label>
              <input required value={courseName} onChange={(e)=>setCourseName(e.target.value)} 
                className="w-full p-4 rounded-2xl bg-black/50 border border-white/5 focus:border-[#3182f6]/50 focus:ring-2 focus:ring-[#3182f6]/50 outline-none transition-all text-white placeholder-gray-600 text-[15px]" 
                placeholder="예: Next.js 14 실전 대비반" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300 ml-1">블로그 콘텐츠 타입</label>
                <select value={topicType} onChange={(e)=>setTopicType(e.target.value)} 
                  className="w-full p-4 rounded-2xl bg-black/50 border border-white/5 focus:border-[#3182f6]/50 focus:ring-2 focus:ring-[#3182f6]/50 outline-none transition-all text-white text-[15px] cursor-pointer appearance-none">
                  <option value="유입형 콘텐츠">유입형 콘텐츠 (조회수 위주)</option>
                  <option value="전환형 콘텐츠">전환형 콘텐츠 (결제 유도)</option>
                  <option value="정보성 콘텐츠">정보성 콘텐츠 (신뢰도 상승)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300 ml-1">타겟 고객군</label>
                <select value={target} onChange={(e)=>setTarget(e.target.value)} 
                  className="w-full p-4 rounded-2xl bg-black/50 border border-white/5 focus:border-[#3182f6]/50 focus:ring-2 focus:ring-[#3182f6]/50 outline-none transition-all text-white text-[15px] cursor-pointer appearance-none">
                  <option value="취업 준비생">취업 준비생</option>
                  <option value="직장인">직장인 (이직/자기계발)</option>
                  <option value="일반인">일반인 (취미/부업)</option>
                </select>
              </div>
            </div>
            
            <div className="pt-2">
              <label className="block text-sm font-semibold mb-3 text-gray-300 ml-1">핵심 소구포인트 (USP)</label>
              <div className="space-y-3">
                <input required value={usp1} onChange={(e)=>setUsp1(e.target.value)} 
                  className="w-full p-4 rounded-2xl bg-black/50 border border-white/5 focus:border-[#3182f6]/50 focus:ring-2 focus:ring-[#3182f6]/50 outline-none transition-all text-white placeholder-gray-600 text-[15px]" 
                  placeholder="1. 단 3일만에 App Router 마스터" />
                <input required value={usp2} onChange={(e)=>setUsp2(e.target.value)} 
                  className="w-full p-4 rounded-2xl bg-black/50 border border-white/5 focus:border-[#3182f6]/50 focus:ring-2 focus:ring-[#3182f6]/50 outline-none transition-all text-white placeholder-gray-600 text-[15px]" 
                  placeholder="2. 실무 수준의 포트폴리오 3개 완성" />
                <input required value={usp3} onChange={(e)=>setUsp3(e.target.value)} 
                  className="w-full p-4 rounded-2xl bg-black/50 border border-white/5 focus:border-[#3182f6]/50 focus:ring-2 focus:ring-[#3182f6]/50 outline-none transition-all text-white placeholder-gray-600 text-[15px]" 
                  placeholder="3. Vercel 배포 및 성능 최적화 풀사이클" />
              </div>
            </div>
          </div>
          
          <button type="submit" className="w-full bg-[#3182f6] text-white p-4 rounded-[20px] font-bold text-[15px] hover:bg-[#1b64da] active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-[0_8px_30px_rgba(49,130,246,0.2)]">
            키워드 추출하기
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </form>
      </div>
    </main>
  );
}
