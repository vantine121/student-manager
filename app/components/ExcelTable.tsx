"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ExcelTable({ students, currentUser, classes }: { students: any[], currentUser: any, classes: any[] }) {
  const [rules, setRules] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [session, setSession] = useState('Sáng')
  const [counts, setCounts] = useState<any>({})
  const [loading, setLoading] = useState(false)
  
  const [filterGroup, setFilterGroup] = useState(0)
  const [filterClass, setFilterClass] = useState('')

  useEffect(() => {
    const fetchRules = async () => {
      const { data } = await supabase.from('rules').select('*').eq('is_active', true).order('type', { ascending: true })
      if (data) setRules(data)
    }
    fetchRules()
  }, [])

  const handleCount = (studentId: string, ruleId: number, delta: number) => {
    setCounts((prev: any) => {
      const studentCounts = prev[studentId] || {}
      const currentCount = studentCounts[ruleId] || 0
      const newCount = currentCount + delta
      if (newCount < 0) return prev
      return { ...prev, [studentId]: { ...studentCounts, [ruleId]: newCount } }
    })
  }

  const handleSubmit = async () => {
    if (!currentUser) return alert("Vui lòng đăng nhập!")
    
    const hasData = Object.values(counts).some((studentObj: any) => Object.values(studentObj).some((val: any) => val > 0))
    if (!hasData) return alert("Bạn chưa chấm điểm cho ai cả!")

    if (!confirm(`Xác nhận lưu sổ ngày ${selectedDate} (${session})?`)) return

    setLoading(true)
    let updateCount = 0

    for (const studentId in counts) {
      const studentCounts = counts[studentId]
      let totalChange = 0
      
      for (const ruleId in studentCounts) {
        const quantity = studentCounts[ruleId]
        if (quantity > 0) {
          const rule = rules.find(r => r.id === Number(ruleId))
          if (rule) {
            const change = rule.points * quantity
            totalChange += change
            await supabase.from('point_logs').insert({
              student_id: studentId, 
              actor_id: currentUser.id, 
              amount: change, 
              reason: `[${selectedDate} - ${session}] ${rule.content} (x${quantity})`
            })
          }
        }
      }

      if (totalChange !== 0) {
        const { data: current } = await supabase.from('profiles').select('current_points').eq('id', studentId).single()
        await supabase.from('profiles').update({ current_points: (current?.current_points || 0) + totalChange }).eq('id', studentId)
        updateCount++
      }
    }

    alert(`✅ Đã lưu xong cho ${updateCount} bạn!`)
    setCounts({})
    window.location.reload()
    setLoading(false)
  }

  const checkPermission = (targetStudent: any) => {
    if (!currentUser) return false
    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'TEACHER' || currentUser.role === 'MONITOR') return true
    if (currentUser.role === 'GROUP_LEADER' && currentUser.group_number === targetStudent.group_number && currentUser.id !== targetStudent.id) return true
    return false
  }

  const getRankBadge = (pts: number) => {
    if (pts >= 400) return <span className="text-[9px] font-bold text-yellow-600 bg-yellow-100 px-1 rounded border border-yellow-300 whitespace-nowrap">TRÙM CUỐI</span>
    if (pts >= 300) return <span className="text-[9px] font-bold text-purple-600 bg-purple-100 px-1 rounded border border-purple-300 whitespace-nowrap">THẦN ĐỒNG</span>
    if (pts >= 200) return <span className="text-[9px] font-bold text-pink-600 bg-pink-100 px-1 rounded border border-pink-300 whitespace-nowrap">HỌC BÁ</span>
    if (pts >= 100) return <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-1 rounded border border-blue-300 whitespace-nowrap">SAO SÁNG</span>
    return <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1 rounded border border-gray-300 whitespace-nowrap">TÂN BINH</span>
  }
  
  const getRoleBadge = (student: any) => {
    if (student.role === 'MONITOR') return <span className="block text-[9px] font-black text-red-600 bg-red-50 border border-red-200 px-1 rounded w-fit mt-0.5 whitespace-nowrap">🛡️ LỚP TRƯỞNG</span>
    if (student.role === 'GROUP_LEADER') return <span className="block text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-200 px-1 rounded w-fit mt-0.5 whitespace-nowrap">⭐ TỔ TRƯỞNG</span>
    return <span className="block text-[9px] font-bold text-gray-400 bg-gray-50 border border-gray-200 px-1 rounded w-fit mt-0.5 whitespace-nowrap">TỔ {student.group_number}</span>
  }

  const displayedStudents = students.filter(student => {
    if (filterClass && student.class_name !== filterClass) return false
    if (filterGroup !== 0 && student.group_number !== filterGroup) return false
    return true
  })

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-[75vh]">
      
      {/* THANH CÔNG CỤ */}
      <div className="p-4 bg-blue-50 border-b border-blue-200 flex flex-wrap gap-3 items-center justify-between shrink-0">
        <div className="flex flex-wrap gap-2 items-center">
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border-2 border-blue-200 p-1.5 rounded-lg font-bold text-gray-700 text-sm outline-none" />
          <select value={session} onChange={(e) => setSession(e.target.value)} className="border-2 border-blue-200 p-1.5 rounded-lg font-bold text-gray-700 text-sm outline-none">
            <option value="Sáng">☀️ Sáng</option>
            <option value="Chiều">🌤️ Chiều</option>
          </select>
          
          {currentUser.role === 'SUPER_ADMIN' && (
             <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="border-2 border-purple-300 bg-purple-50 p-1.5 rounded-lg font-bold text-purple-800 text-sm outline-none">
               <option value="">🏫 Tất cả lớp</option>
               {classes?.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
             </select>
          )}

          <select value={filterGroup} onChange={(e) => setFilterGroup(Number(e.target.value))} className="border-2 border-orange-300 bg-orange-50 p-1.5 rounded-lg font-bold text-orange-800 text-sm outline-none">
            <option value={0}>👁️ Tất Cả Tổ</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => <option key={num} value={num}>Tổ {num}</option>)}
          </select>
        </div>

        {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'TEACHER' || currentUser?.role === 'MONITOR' || currentUser?.role === 'GROUP_LEADER') && (
          <button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg shadow-md transition-transform active:scale-95 disabled:opacity-50 text-sm flex items-center gap-2">
            {loading ? '⏳...' : '💾 LƯU SỔ'}
          </button>
        )}
      </div>

      {/* BẢNG EXCEL */}
      <div className="overflow-auto flex-1 relative custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-40 shadow-md">
            <tr>
              {/* Cột Tên: Giữ min-w-250px để đủ chỗ */}
              <th className="px-3 py-2 border-b border-r bg-gray-100 min-w-[250px] sticky left-0 z-50 shadow-r">HỌC SINH ({displayedStudents.length})</th>
              {rules.map(rule => (
                <th key={rule.id} className={`px-1 py-1 border-b border-r text-center min-w-[100px] align-middle ${rule.type === 'PLUS' ? 'bg-green-50/90 text-green-800' : 'bg-red-50/90 text-red-800'}`}>
                  <div className="flex flex-col items-center justify-center h-full gap-1 p-1"><span className="text-[10px] font-extrabold leading-tight text-center line-clamp-2">{rule.content}</span><span className={`text-[10px] font-black px-1.5 py-0.5 rounded border shadow-sm ${rule.type === 'PLUS' ? 'bg-white border-green-200' : 'bg-white border-red-200'}`}>{rule.points > 0 ? '+' : ''}{rule.points}</span></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedStudents.map((student, idx) => {
              const canEdit = checkPermission(student)
              return (
                // SỬA: Bỏ h-16 cứng, dùng min-h-16 để hàng tự giãn nếu tên dài
                <tr key={student.id} className={`border-b hover:bg-yellow-50 transition-colors min-h-[64px] ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  
                  {/* CỘT TÊN: Cho phép xuống dòng (whitespace-normal) */}
                  <td className="px-3 py-2 border-r font-medium text-gray-900 sticky left-0 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] bg-inherit align-middle">
                    <div className="flex flex-col justify-center gap-1">
                      <div className="flex justify-between items-start w-full gap-2">
                        {/* SỬA: whitespace-normal break-words để xuống dòng */}
                        <span className="text-sm font-bold text-blue-900 whitespace-normal break-words leading-tight max-w-[180px]">
                          {student.full_name}
                        </span>
                        <span className={`text-xs font-black whitespace-nowrap ${student.current_points >= 100 ? 'text-green-600' : 'text-red-500'}`}>
                          {student.current_points}đ
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {getRoleBadge(student)}
                        {getRankBadge(student.current_points)}
                        {currentUser.role === 'SUPER_ADMIN' && <span className="text-[8px] text-purple-400 font-bold bg-purple-50 border px-1 rounded w-fit">{student.class_name}</span>}
                      </div>
                    </div>
                  </td>

                  {rules.map(rule => {
                    const count = counts[student.id]?.[rule.id] || 0
                    return (
                      <td key={rule.id} className="p-0 border-r text-center align-middle relative">
                        {canEdit ? (
                          <div className="flex items-center justify-center gap-1 w-full h-full py-2">
                            <button onClick={() => handleCount(student.id, rule.id, -1)} className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold transition-opacity ${count > 0 ? 'opacity-100 cursor-pointer hover:bg-opacity-80' : 'opacity-0 cursor-default'} ${rule.type === 'PLUS' ? 'bg-green-400' : 'bg-red-400'}`}>-</button>
                            <span className={`w-6 text-center font-bold ${count > 0 ? 'text-gray-900 text-lg' : 'text-gray-200 text-sm'}`}>{count > 0 ? count : '0'}</span>
                            <button onClick={() => handleCount(student.id, rule.id, 1)} className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:scale-110 transition-transform shadow-sm ${rule.type === 'PLUS' ? 'bg-green-600' : 'bg-red-600'}`}>+</button>
                          </div>
                        ) : <div className="w-full h-full flex items-center justify-center bg-gray-100/50 cursor-not-allowed opacity-20 min-h-[64px]"><span className="text-base">🔒</span></div>}
                    </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
        {displayedStudents.length === 0 && <div className="text-center p-10 text-gray-400 italic">Không tìm thấy học sinh.</div>}
      </div>
    </div>
  )
}