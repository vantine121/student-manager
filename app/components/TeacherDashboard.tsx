"use client"
import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import UserManagement from './UserManagement'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'users'>('orders')
  const [orders, setOrders] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // Lấy thông tin người dùng hiện tại để truyền cho UserManagement
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setCurrentUser(data)
      }
    }
    getUser()
    fetchData()
  }, [])

  async function fetchData() {
    const { data: orderData } = await supabase.from('redemptions').select(`id, status, created_at, profiles (full_name, class_name), rewards (name, cost)`).eq('status', 'PENDING').order('created_at', { ascending: false })
    if (orderData) setOrders(orderData)

    const { data: logData } = await supabase.from('point_logs').select(`created_at, amount, reason, student:profiles!point_logs_student_id_fkey (full_name), actor:profiles!point_logs_actor_id_fkey (full_name, role)`).order('created_at', { ascending: false }).limit(50)
    if (logData) setLogs(logData)
  }

  const handleDeliver = async (orderId: number) => {
    if (!confirm("Xác nhận giao hàng?")) return
    setLoading(true)
    await supabase.from('redemptions').update({ status: 'DELIVERED' }).eq('id', orderId)
    alert("✅ Đã xong!")
    fetchData()
    setLoading(false)
  }

  const handleResetMonth = async () => {
    if (!confirm("CẢNH BÁO: Reset điểm về 100 và XÓA TỔ?")) return
    setLoading(true)
    const { error } = await supabase.from('profiles').update({ current_points: 100, group_number: 0, is_group_locked: false }).neq('role', 'TEACHER')
    if (!error) {
      await supabase.from('point_logs').insert({ student_id: null, amount: 0, reason: '--- TỔNG KẾT THÁNG ---' })
      alert("🎉 Reset thành công!")
      window.location.reload()
    } else alert("Lỗi: " + error.message)
    setLoading(false)
  }
  
  const handleRewardTopStudents = async () => {
    if (!confirm("TỰ ĐỘNG thưởng xu cho Top 3?")) return
    setLoading(true)
    // Lấy danh sách học sinh CÙNG LỚP (nếu là GV) hoặc tất cả (nếu là Admin) - Ở đây làm đơn giản là lấy tất cả top server trước
    // Để chuẩn hơn, bạn có thể lọc theo lớp của GV.
    const { data: students } = await supabase.from('profiles').select('*').neq('role', 'TEACHER').neq('role', 'SUPER_ADMIN').order('current_points', { ascending: false }).limit(3)
    
    if (students) {
        for (let i = 0; i < students.length; i++) {
            const reward = i === 0 ? 30 : i === 1 ? 20 : 10
            await supabase.from('profiles').update({ wallet_coins: (students[i].wallet_coins || 0) + reward }).eq('id', students[i].id)
            await supabase.from('point_logs').insert({ student_id: students[i].id, amount: 0, reason: `🎁 Thưởng Top ${i+1} (+${reward} xu)` })
        }
        alert("🎉 Đã phát thưởng!")
    }
    setLoading(false)
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('vi-VN')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 border-b pb-2">
        <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 font-bold rounded-t-lg transition-colors ${activeTab === 'orders' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>🎁 Duyệt Quà & Log</button>
        <button onClick={() => setActiveTab('users')} className={`px-4 py-2 font-bold rounded-t-lg transition-colors ${activeTab === 'users' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>👥 Danh Sách Lớp</button>
      </div>

      {activeTab === 'orders' && (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-400">
              <h2 className="text-xl font-bold text-yellow-700 mb-4">🎁 Đơn Chờ Giao ({orders.length})</h2>
              <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
                {orders.length === 0 ? <p className="text-gray-400 italic text-center py-4">Sạch bóng đơn hàng!</p> : orders.map((order) => (
                  <div key={order.id} className="border p-3 rounded bg-yellow-50 flex justify-between items-center">
                    <div><p className="font-bold text-blue-800">{order.profiles?.full_name}</p><p className="text-sm">Đổi: <b>{order.rewards?.name}</b></p></div>
                    <button disabled={loading} onClick={() => handleDeliver(order.id)} className="bg-green-600 text-white text-xs font-bold px-3 py-2 rounded">Đã Đưa</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-400">
              <h2 className="text-xl font-bold text-blue-700 mb-4">📜 Nhật Ký</h2>
              <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto text-sm">
                {logs.map((log, index) => (
                  <div key={index} className="border-b pb-2 mb-1"><div className="flex justify-between"><span className="font-bold">{log.actor?.full_name || 'Hệ thống'}</span><span className="text-[10px] text-gray-400">{formatDate(log.created_at)}</span></div><div><span className={log.amount > 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{log.amount > 0 ? "+" : ""}{log.amount}đ</span><span className="mx-1">cho</span><span className="font-bold text-blue-600">{log.student?.full_name || 'Cả lớp'}</span></div><p className="text-xs italic text-gray-500">"{log.reason}"</p></div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-gray-100 p-6 rounded-lg border-2 border-gray-300 flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
            <div><h3 className="text-lg font-bold text-gray-700 uppercase">⚡ Bảng Điều Khiển</h3><p className="text-sm text-gray-500">Trao thưởng trước khi Reset tháng nhé!</p></div>
            <div className="flex gap-3"><button onClick={handleRewardTopStudents} disabled={loading} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded shadow-lg border-b-4 border-yellow-700 active:border-b-0 active:mt-1 transition-all">🏆 TRAO THƯỞNG TOP</button><button onClick={handleResetMonth} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded shadow-lg border-b-4 border-red-800 active:border-b-0 active:mt-1 transition-all">🔄 RESET THÁNG MỚI</button></div>
          </div>
        </>
      )}

      {/* TRUYỀN currentUser VÀO ĐÂY */}
      {activeTab === 'users' && currentUser && (
        <UserManagement currentUser={currentUser} />
      )}
    </div>
  )
}
