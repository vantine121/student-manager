"use client"
import { createClient } from '@supabase/supabase-js'
import { useState } from 'react'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function StudentCard({ student, currentUser }: { student: any, currentUser: any }) {
  const [points, setPoints] = useState(student.current_points)
  const [loading, setLoading] = useState(false)

  // --- LOGIC RANK MỚI (TO & ĐẸP) ---
  const getRankInfo = (pts: number) => {
    // Thêm style: scale (độ to), glow (phát sáng)
    if (pts >= 400) return { title: 'TRÙM CUỐI', color: 'bg-yellow-50 border-yellow-500', text: 'text-yellow-700', icon: '👑', scale: 'scale-110', glow: 'shadow-yellow-500/50' }
    if (pts >= 300) return { title: 'THẦN ĐỒNG', color: 'bg-purple-50 border-purple-500', text: 'text-purple-700', icon: '🔮', scale: 'scale-105', glow: 'shadow-purple-500/30' }
    if (pts >= 200) return { title: 'HỌC BÁ', color: 'bg-pink-50 border-pink-500', text: 'text-pink-700', icon: '🧠', scale: 'scale-100', glow: '' }
    if (pts >= 100) return { title: 'SAO SÁNG', color: 'bg-blue-50 border-blue-500', text: 'text-blue-700', icon: '🌟', scale: 'scale-100', glow: '' }
    if (pts >= 50) return { title: 'ONG CHĂM CHỈ', color: 'bg-orange-50 border-orange-400', text: 'text-orange-700', icon: '🐝', scale: 'scale-100', glow: '' }
    return { title: 'TÂN BINH', color: 'bg-gray-50 border-gray-300', text: 'text-gray-500', icon: '🌱', scale: 'scale-100', glow: '' }
  }

  const rank = getRankInfo(points)
  const canEdit = currentUser && (currentUser.role === 'TEACHER' || currentUser.role === 'MONITOR' || (currentUser.role === 'GROUP_LEADER' && currentUser.group_number === student.group_number && currentUser.id !== student.id))

  const handleUpdate = async (amount: number, reason: string) => {
    if (loading || !canEdit) return
    setLoading(true)
    const newPoints = points + amount
    setPoints(newPoints)
    const { error } = await supabase.from('profiles').update({ current_points: newPoints }).eq('id', student.id)
    if (!error) await supabase.from('point_logs').insert({ student_id: student.id, actor_id: currentUser.id, amount, reason })
    else setPoints(points)
    setLoading(false)
  }

  return (
    <div className={`relative border-2 rounded-xl p-4 transition-all duration-300 hover:shadow-lg ${rank.color} ${rank.glow ? 'shadow-lg ' + rank.glow : ''}`}>
      
      {/* Hiệu ứng nhãn Rank to đùng nằm đè lên góc phải */}
      <div className={`absolute -top-3 -right-3 bg-white border-2 px-3 py-1 rounded-full shadow-sm flex items-center gap-1 transform ${rank.scale} ${rank.text} ${rank.color.replace('bg-', 'border-')}`}>
        <span className="text-xl">{rank.icon}</span>
        <span className="font-black text-xs uppercase tracking-wider">{rank.title}</span>
      </div>

      <div className="flex gap-4 items-center">
        {/* Avatar tròn đơn giản */}
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 text-lg border-2 border-white shadow">
          {student.full_name.charAt(0)}
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 text-lg leading-tight">{student.full_name}</h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5 uppercase">
             {student.role === 'TEACHER' ? 'Giáo viên' : `Tổ ${student.group_number || '?'}`}
          </p>
        </div>

        <div className="text-right mr-4">
          <span className={`text-3xl font-black ${points >= 100 ? 'text-green-600' : 'text-gray-600'}`}>{points}</span>
          <span className="block text-[8px] text-gray-400 font-bold uppercase">Điểm</span>
        </div>
      </div>

      {/* Khu vực nút bấm (Chỉ hiện khi di chuột hoặc luôn hiện nếu muốn) */}
      <div className={`grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-dashed border-gray-300 ${!canEdit ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
        <button onClick={() => handleUpdate(-5, 'Nói chuyện')} className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold py-2 rounded transition-colors border border-red-200">🤫 -5</button>
        <button onClick={() => handleUpdate(-15, 'K.Làm bài')} className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold py-2 rounded transition-colors border border-red-200">📝 -15</button>
        <button onClick={() => handleUpdate(5, 'Phát biểu')} className="bg-green-50 hover:bg-green-100 text-green-600 text-[10px] font-bold py-2 rounded transition-colors border border-green-200">🙋‍♂️ +5</button>
        <button onClick={() => handleUpdate(10, 'Điểm 10')} className="bg-yellow-50 hover:bg-yellow-100 text-yellow-600 text-[10px] font-bold py-2 rounded transition-colors border border-yellow-200">🌟 +10</button>
      </div>
    </div>
  )
}
