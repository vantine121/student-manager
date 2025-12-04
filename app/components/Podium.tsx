"use client"

export default function Podium({ topStudents }: { topStudents: any[] }) {
  const first = topStudents[0]
  const second = topStudents[1]
  const third = topStudents[2]

  return (
    // 1. Xóa 'mt-12' để đỉnh khung ngang bằng với bảng bên cạnh
    // 2. Tăng 'pt-32' (padding-top) để đẩy học sinh xuống sâu hơn, không che chữ
    <div className="bg-gradient-to-b from-yellow-50 to-white p-4 pt-32 rounded-3xl shadow-2xl border-4 border-yellow-200 flex flex-col items-center justify-end relative h-full min-h-[500px]">
      
      {/* Tiêu đề nằm cố định ở trên cùng */}
      <h2 className="absolute top-5 text-xl md:text-3xl font-black text-yellow-800 uppercase tracking-widest flex items-center gap-3 drop-shadow-sm opacity-90 z-0">
        🏆 Bảng Vàng 🏆
      </h2>
      
      <div className="flex justify-center items-end w-full gap-2 md:gap-4 mt-15 z-10">
        
        {/* --- HẠNG 2 (BẠC) --- */}
        <div className="flex flex-col items-center w-1/3 group relative">
          {second && (
            <div className="flex flex-col items-center mb-2 transition-transform group-hover:-translate-y-2 duration-300 w-full">
              <div className="absolute -top-8 text-3xl md:text-4xl drop-shadow animate-pulse z-20">🥈</div>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-gray-300 overflow-hidden bg-gray-100 shadow-xl flex items-center justify-center ring-2 ring-gray-50 z-10">
                 <span className="text-xl md:text-2xl font-bold text-gray-500">{second.full_name.charAt(0)}</span>
              </div>
              <p className="font-bold text-gray-800 text-[10px] md:text-xs mt-2 text-center line-clamp-1 w-full px-1">{second.full_name}</p>
              <div className="bg-gray-200 text-gray-600 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5">
                {second.current_points} đ
              </div>
            </div>
          )}
          <div className="w-full h-24 md:h-60 bg-gradient-to-t from-gray-400 to-gray-200 rounded-t-xl border-t-4 border-gray-400 flex items-end justify-center pb-2 shadow-inner">
            <span className="text-5xl font-black text-white opacity-50 drop-shadow-lg">2</span>
          </div>
        </div>

        {/* --- HẠNG 1 (VÀNG) --- */}
        <div className="flex flex-col items-center w-1/3 -mt-12 z-20 group relative">
          {first && (
            <div className="flex flex-col items-center mb-2 relative transition-transform group-hover:-translate-y-2 duration-300 w-full">
              <div className="absolute -top-12 text-5xl md:text-6xl drop-shadow-md animate-bounce z-30">👑</div>
              
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 md:border-8 border-yellow-400 overflow-hidden bg-yellow-100 shadow-2xl flex items-center justify-center ring-4 ring-yellow-200 z-10">
                 <span className="text-3xl md:text-4xl font-black text-yellow-600">{first.full_name.charAt(0)}</span>
              </div>
              
              <div className="mt-1 bg-yellow-500 text-white text-[10px] md:text-xs font-black px-3 py-0.5 rounded-full border-2 border-yellow-300 shadow scale-105 z-20">
                🔥 {first.current_points}
              </div>
              <p className="font-black text-yellow-800 text-xs md:text-sm mt-1 text-center line-clamp-1 w-full px-1 uppercase drop-shadow-sm">{first.full_name}</p>
            </div>
          )}
          <div className="w-full h-40 md:h-80 bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t-xl border-t-4 md:border-8 border-yellow-500 flex items-end justify-center pb-2 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
            <span className="text-7xl font-black text-white opacity-60 drop-shadow-lg">1</span>
          </div>
        </div>

        {/* --- HẠNG 3 (ĐỒNG) --- */}
        <div className="flex flex-col items-center w-1/3 group relative">
          {third && (
            <div className="flex flex-col items-center mb-2 transition-transform group-hover:-translate-y-1 duration-300 w-full">
              <div className="absolute -top-8 text-3xl md:text-4xl drop-shadow animate-pulse z-20">🥉</div>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-orange-300 overflow-hidden bg-orange-100 shadow-md flex items-center justify-center ring-2 ring-orange-50 z-10">
                 <span className="text-xl md:text-2xl font-bold text-orange-700">{third.full_name.charAt(0)}</span>
              </div>
              <p className="font-bold text-gray-800 text-[10px] md:text-xs mt-2 text-center line-clamp-1 w-full px-1">{third.full_name}</p>
              <div className="bg-orange-100 text-orange-600 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5">
                {third.current_points} đ
              </div>
            </div>
          )}
          <div className="w-full h-16 md:h-40 bg-gradient-to-t from-orange-400 to-orange-200 rounded-t-lg border-t-4 border-orange-400 flex items-end justify-center pb-2 shadow-inner">
            <span className="text-4xl md:text-5xl font-black text-white opacity-50 drop-shadow">3</span>
          </div>
        </div>

      </div>
    </div>
  )
}