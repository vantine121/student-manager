"use client"

export default function Podium({ topStudents }: { topStudents: any[] }) {
  const first = topStudents[0]
  const second = topStudents[1]
  const third = topStudents[2]

  return (
    <div className="bg-gradient-to-b from-yellow-50 to-white p-4 pt-20 md:pt-32 rounded-3xl shadow-xl border-2 border-yellow-200 flex flex-col items-center justify-end relative h-full min-h-[400px] md:min-h-[500px]">
      
      <h2 className="absolute top-4 text-base md:text-3xl font-black text-yellow-800 uppercase tracking-widest flex items-center gap-2 drop-shadow-sm opacity-90 z-0 w-full justify-center text-center">
        🏆 Bảng Vàng 🏆
      </h2>
      
      <div className="flex justify-center items-end w-full gap-1 md:gap-4 mt-8 z-10">
        
        {/* TOP 2 */}
        <div className="flex flex-col items-center w-1/3 group relative">
          {second && (
            <div className="flex flex-col items-center mb-1 w-full">
              <div className="absolute -top-6 md:-top-8 text-2xl md:text-4xl animate-bounce z-20">🥈</div>
              <div className="w-12 h-12 md:w-20 md:h-20 rounded-full border-2 md:border-4 border-gray-300 overflow-hidden bg-gray-100 shadow-md flex items-center justify-center z-10">
                 <span className="text-lg md:text-2xl font-bold text-gray-500">{second.full_name.charAt(0)}</span>
              </div>
              <p className="font-bold text-gray-800 text-[9px] md:text-xs mt-2 text-center line-clamp-1 w-full px-1">{second.full_name}</p>
              <div className="bg-gray-200 text-gray-600 text-[8px] md:text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5">{second.current_points}</div>
            </div>
          )}
          <div className="w-full h-20 md:h-32 bg-gradient-to-t from-gray-400 to-gray-200 rounded-t-lg flex items-end justify-center pb-2"><span className="text-3xl md:text-5xl font-black text-white opacity-50">2</span></div>
        </div>

        {/* TOP 1 */}
        <div className="flex flex-col items-center w-1/3 -mt-8 z-20 group relative">
          {first && (
            <div className="flex flex-col items-center mb-1 w-full">
              <div className="absolute -top-10 md:-top-12 text-4xl md:text-6xl animate-bounce z-30">👑</div>
              <div className="w-16 h-16 md:w-28 md:h-28 rounded-full border-4 md:border-8 border-yellow-400 overflow-hidden bg-yellow-100 shadow-lg flex items-center justify-center z-10">
                 <span className="text-2xl md:text-5xl font-black text-yellow-600">{first.full_name.charAt(0)}</span>
              </div>
              <div className="mt-1 bg-yellow-500 text-white text-[9px] md:text-xs font-black px-2 py-0.5 rounded-full shadow z-20">🔥 {first.current_points}</div>
              <p className="font-black text-yellow-800 text-[10px] md:text-sm mt-1 text-center line-clamp-1 w-full px-1 uppercase">{first.full_name}</p>
            </div>
          )}
          <div className="w-full h-32 md:h-52 bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t-lg flex items-end justify-center pb-2 shadow-lg"><span className="text-5xl md:text-7xl font-black text-white opacity-60">1</span></div>
        </div>

        {/* TOP 3 */}
        <div className="flex flex-col items-center w-1/3 group relative">
          {third && (
            <div className="flex flex-col items-center mb-1 w-full">
              <div className="absolute -top-6 md:-top-8 text-2xl md:text-4xl animate-bounce z-20">🥉</div>
              <div className="w-12 h-12 md:w-20 md:h-20 rounded-full border-2 md:border-4 border-orange-300 overflow-hidden bg-orange-100 shadow-md flex items-center justify-center z-10">
                 <span className="text-lg md:text-2xl font-bold text-orange-700">{third.full_name.charAt(0)}</span>
              </div>
              <p className="font-bold text-gray-800 text-[9px] md:text-xs mt-2 text-center line-clamp-1 w-full px-1">{third.full_name}</p>
              <div className="bg-orange-100 text-orange-600 text-[8px] md:text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5">{third.current_points}</div>
            </div>
          )}
          <div className="w-full h-12 md:h-20 bg-gradient-to-t from-orange-400 to-orange-200 rounded-t-lg flex items-end justify-center pb-2"><span className="text-3xl md:text-5xl font-black text-white opacity-50">3</span></div>
        </div>

      </div>
    </div>
  )
}