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
              student_id: studentId, actor_id: currentUser.id, amount: change, 
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
    alert(`✅ Đã lưu xong cho ${updateCount} bạn!`); setCounts({}); window.location.reload(); setLoading(false)
  }

  const checkPermission = (targetStudent: any) => {
    if (!currentUser) return false
    if (['SUPER_ADMIN', 'TEACHER', 'MONITOR'].includes(currentUser.role)) return true
    if (currentUser.role === 'GROUP_LEADER' && currentUser.group_number === targetStudent.group_number && currentUser.id !== targetStudent.id) return true
    return false
  }

  const displayedStudents = students.filter(student => {
    if (filterClass && student.class_name !== filterClass) return false
    if (filterGroup !== 0 && student.group_number !== filterGroup) return false
    return true
  })

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-[70vh] md:h-[75vh]">
      
      {/* THANH CÔNG CỤ (Tối ưu Mobile) */}
      <div className="p-3 bg-blue-50 border-b border-blue-200 flex flex-col md:flex-row gap-3 justify-between shrink-0">
        <div className="flex flex-wrap gap-2 items-center w-full">
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="flex-1 min-w-[130px] border-2 border-blue-200 p-2 rounded-lg font-bold text-gray-700 text-sm outline-none" />
          <select value={session} onChange={(e) => setSession(e.target.value)} className="w-24 border-2 border-blue-200 p-2 rounded-lg font-bold text-gray-700 text-sm outline-none">
            <option value="Sáng">Sáng</option><option value="Chiều">Chiều</option>
          </select>
          
          {currentUser.role === 'SUPER_ADMIN' && (
             <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="flex-1 min-w-[100px] border-2 border-purple-300 bg-purple-50 p-2 rounded-lg font-bold text-purple-800 text-sm outline-none">
               <option value="">Tất cả lớp</option>{classes?.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
             </select>
          )}
          <select value={filterGroup} onChange={(e) => setFilterGroup(Number(e.target.value))} className="flex-1 min-w-[100px] border-2 border-orange-300 bg-orange-50 p-2 rounded-lg font-bold text-orange-800 text-sm outline-none">
            <option value={0}>Tất Cả Tổ</option>{[1, 2, 3, 4, 5, 6, 7, 8].map(num => <option key={num} value={num}>Tổ {num}</option>)}
          </select>
        </div>

        {(['SUPER_ADMIN', 'TEACHER', 'MONITOR', 'GROUP_LEADER'].includes(currentUser?.role)) && (
          <button onClick={handleSubmit} disabled={loading} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-lg shadow-md active:scale-95 text-sm flex items-center justify-center gap-2">
            {loading ? '⏳...' : '💾 LƯU SỔ'}
          </button>
        )}
      </div>

      {/* BẢNG EXCEL */}
      <div className="overflow-auto flex-1 relative custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-40 shadow-md">
            <tr>
              {/* CỘT TÊN DÍNH CHẶT BÊN TRÁI (Sticky Left) */}
              <th className="px-2 py-3 border-b border-r bg-gray-50 min-w-[140px] md:min-w-[200px] sticky left-0 z-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                HỌC SINH
              </th>
              {rules.map(rule => (
                <th key={rule.id} className={`px-1 py-1 border-b border-r text-center min-w-[90px] md:min-w-[110px] align-middle ${rule.type === 'PLUS' ? 'bg-green-50/90' : 'bg-red-50/90'}`}>
                  <div className="flex flex-col items-center justify-center h-full gap-1 p-1">
                    <span className="text-[10px] font-bold leading-tight text-center line-clamp-2 h-8 flex items-center">{rule.content}</span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border shadow-sm bg-white`}>{rule.points > 0 ? '+' : ''}{rule.points}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedStudents.map((student, idx) => {
              const canEdit = checkPermission(student)
              return (
                <tr key={student.id} className={`border-b hover:bg-yellow-50 transition-colors h-16 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  {/* CỘT TÊN CŨNG DÍNH TRÁI */}
                  <td className="px-2 border-r font-medium text-gray-900 sticky left-0 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] bg-inherit align-middle">
                    <div className="flex flex-col justify-center gap-0.5">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs md:text-sm font-bold text-blue-900 truncate max-w-[90px] md:max-w-[130px]">{student.full_name}</span>
                        <span className={`text-[10px] font-black ${student.current_points >= 100 ? 'text-green-600' : 'text-red-500'}`}>{student.current_points}</span>
                      </div>
                      <span className="text-[9px] text-gray-400 font-bold border px-1 rounded w-fit">Tổ {student.group_number}</span>
                    </div>
                  </td>
                  {rules.map(rule => {
                    const count = counts[student.id]?.[rule.id] || 0
                    return (
                      <td key={rule.id} className="p-0 border-r text-center align-middle relative">
                        {canEdit ? (
                          <div className="flex items-center justify-center gap-1 w-full h-14">
                            {/* Nút bấm to hơn cho điện thoại */}
                            <button onClick={() => handleCount(student.id, rule.id, -1)} className={`w-7 h-7 md:w-6 md:h-6 rounded-full flex items-center justify-center text-white font-bold ${count > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${rule.type === 'PLUS' ? 'bg-green-400' : 'bg-red-400'}`}>-</button>
                            <span className={`w-5 text-center font-bold ${count > 0 ? 'text-gray-900' : 'text-gray-200'}`}>{count > 0 ? count : '0'}</span>
                            <button onClick={() => handleCount(student.id, rule.id, 1)} className={`w-7 h-7 md:w-6 md:h-6 rounded-full flex items-center justify-center text-white font-bold active:scale-90 transition-transform ${rule.type === 'PLUS' ? 'bg-green-600' : 'bg-red-600'}`}>+</button>
                          </div>
                        ) : <div className="w-full h-14 flex items-center justify-center opacity-20 text-xl">🔒</div>}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}