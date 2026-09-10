"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LearningReportModal({ currentUser, onClose }: { currentUser: any, onClose: () => void }) {
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ plus: 0, minus: 0, total_mistakes: 0, total_good: 0 })

  useEffect(() => {
    async function fetchLogs() {
      // Lấy toàn bộ lịch sử điểm của học sinh này
      const { data } = await supabase
        .from('point_logs')
        .select('*')
        .eq('student_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (data) {
        // --- THUẬT TOÁN THỐNG KÊ ---
        const report: any = {}
        let plusCount = 0
        let minusCount = 0
        let plusTotal = 0
        let minusTotal = 0

        data.forEach(log => {
          // Bỏ qua các log hệ thống (như Reset tháng)
          if (log.reason.includes('---')) return

          // Lấy tên lỗi (Bỏ phần ngày tháng và số lượng trong ngoặc nếu có)
          // Ví dụ: "[03/12 - Sáng] Nói chuyện (x2)" -> Lấy "Nói chuyện"
          let cleanReason = log.reason.split('] ')[1] || log.reason
          cleanReason = cleanReason.split(' (x')[0]

          if (!report[cleanReason]) {
            report[cleanReason] = { name: cleanReason, count: 0, totalPoints: 0, type: log.amount > 0 ? 'PLUS' : 'MINUS' }
          }

          // Cộng dồn
          report[cleanReason].count += 1
          report[cleanReason].totalPoints += log.amount

          // Tính tổng quan
          if (log.amount > 0) {
            plusCount++
            plusTotal += log.amount
          } else if (log.amount < 0) {
            minusCount++
            minusTotal += log.amount
          }
        })

        setStats(Object.values(report))
        setSummary({ plus: plusTotal, minus: minusTotal, total_mistakes: minusCount, total_good: plusCount })
      }
      setLoading(false)
    }
    fetchLogs()
  }, [currentUser])

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[80vh]">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 text-white flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">📊 Kết Quả Học Tập Chi Tiết</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50">
          
          {/* 1. TỔNG QUAN */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-100 p-4 rounded-xl border border-green-200 text-center">
              <p className="text-green-600 text-xs font-bold uppercase">Tổng Điểm Cộng</p>
              <p className="text-3xl font-black text-green-700">+{summary.plus}</p>
              <p className="text-xs text-green-600 mt-1">{summary.total_good} lần được khen</p>
            </div>
            <div className="bg-red-100 p-4 rounded-xl border border-red-200 text-center">
              <p className="text-red-600 text-xs font-bold uppercase">Tổng Điểm Trừ</p>
              <p className="text-3xl font-black text-red-700">{summary.minus}</p>
              <p className="text-xs text-red-600 mt-1">{summary.total_mistakes} lần vi phạm</p>
            </div>
          </div>

          {/* 2. CHI TIẾT VI PHẠM & THÀNH TÍCH */}
          {loading ? (
            <p className="text-center text-gray-500">Đang phân tích dữ liệu...</p>
          ) : (
            <div className="space-y-6">
              
              {/* BẢNG VI PHẠM */}
              <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
                <div className="bg-red-50 px-4 py-2 border-b border-red-100 font-bold text-red-700 text-sm flex items-center gap-2">
                  <span>⚠️ Các Lỗi Vi Phạm</span>
                </div>
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2">Nội dung</th>
                      <th className="px-4 py-2 text-center">Số lần</th>
                      <th className="px-4 py-2 text-right">Tổng trừ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.filter(s => s.type === 'MINUS').map((item, idx) => (
                      <tr key={idx} className="border-b last:border-0 hover:bg-red-50/50">
                        <td className="px-4 py-3 font-medium text-gray-700">{item.name}</td>
                        <td className="px-4 py-3 text-center font-bold text-gray-600">{item.count}</td>
                        <td className="px-4 py-3 text-right font-bold text-red-600">{item.totalPoints}</td>
                      </tr>
                    ))}
                    {stats.filter(s => s.type === 'MINUS').length === 0 && (
                      <tr><td colSpan={3} className="p-4 text-center text-gray-400 italic">Chưa có vi phạm nào. Giỏi quá! 👏</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* BẢNG THÀNH TÍCH */}
              <div className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden">
                <div className="bg-green-50 px-4 py-2 border-b border-green-100 font-bold text-green-700 text-sm flex items-center gap-2">
                  <span>🌟 Thành Tích & Khen Thưởng</span>
                </div>
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2">Nội dung</th>
                      <th className="px-4 py-2 text-center">Số lần</th>
                      <th className="px-4 py-2 text-right">Tổng cộng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.filter(s => s.type === 'PLUS').map((item, idx) => (
                      <tr key={idx} className="border-b last:border-0 hover:bg-green-50/50">
                        <td className="px-4 py-3 font-medium text-gray-700">{item.name}</td>
                        <td className="px-4 py-3 text-center font-bold text-gray-600">{item.count}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">+{item.totalPoints}</td>
                      </tr>
                    ))}
                    {stats.filter(s => s.type === 'PLUS').length === 0 && (
                      <tr><td colSpan={3} className="p-4 text-center text-gray-400 italic">Cố gắng phát biểu và làm bài tốt nhé! 💪</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
