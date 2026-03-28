export default function ProgressBar({ step }: { step: number }) {
  const steps = ["기본 정보", "키워드 추출", "주제 기획", "콘텐츠 생성"];
  return (
    <div className="w-full pt-8 pb-4">
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex justify-between items-center relative">
          <div className="absolute top-1/2 left-0 w-full h-1.5 bg-[#1c1c1e] -z-10 rounded-full transform -translate-y-1/2"></div>
          <div 
            className="absolute top-1/2 left-0 h-1.5 bg-[#3182f6] -z-10 rounded-full transform -translate-y-1/2 transition-all duration-500 ease-in-out" 
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>
          
          {steps.map((s, i) => {
            const isActive = step >= i + 1;
            const isCurrent = step === i + 1;
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${isActive ? 'bg-[#3182f6] text-white shadow-[0_4px_15px_rgba(49,130,246,0.5)]' : 'bg-[#1c1c1e] text-gray-500 border border-white/5'} ${isCurrent ? 'scale-110' : 'scale-100'}`}>
                  {i + 1}
                </div>
                <span className={`text-xs font-semibold tracking-tight transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                  {s}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
