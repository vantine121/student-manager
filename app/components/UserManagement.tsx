"use client"
import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Nhận thêm prop currentUser
export default function UserManagement({ currentUser }: { currentUser: any }) {
  const [users, setUsers] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [newClassName, setNewClassName] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchData = async () => {
    // --- LOGIC LỌC QUAN TRỌNG ---
    let query = supabase.from('profiles').select('*')

    // Nếu là Giáo Viên -> Chỉ lấy danh sách thuộc lớp mình
    if (currentUser.role === 'TEACHER') {
      query = query.eq('class_name', currentUser.class_name)
    }
    // Nếu là SUPER_ADMIN -> Lấy tất cả (Không cần lọc thêm)

    const { data: userData } = await query

    if (userData) {
      const getRoleScore = (role: string) => {
        if (role === 'SUPER_ADMIN') return 0
        if (role === 'TEACHER') return 1
        if (role === 'MONITOR') return 2
        if (role === 'GROUP_LEADER') return 3
        return 4
      }

      const sortedData = userData.sort((a, b) => {
        const scoreA = getRoleScore(a.role)
        const scoreB = getRoleScore(b.role)
        if (scoreA !== scoreB) return scoreA - scoreB
        return (a.full_name || '').localeCompare(b.full_name || '', 'vi')
      })
      setUsers(sortedData)
    }

    const { data: classData } = await supabase.from('classes').select('*').order('name', { ascending: true })
    if (classData) setClasses(classData)
  }

  useEffect(() => { fetchData() }, [currentUser]) // Chạy lại khi currentUser thay đổi

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true
    const lowerTerm = searchTerm.toLowerCase()
    const name = (user.full_name || '').toLowerCase()
    const className = (user.class_name || '').toLowerCase()
    const group = `tổ ${user.group_number}`
    return name.includes(lowerTerm) || className.includes(lowerTerm) || group.includes(lowerTerm) || user.group_number.toString() === lowerTerm
  })

  // Các hàm xử lý
  const handleUpdateClass = async (userId: string, newClass: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, class_name: newClass } : u))
    await supabase.from('profiles').update({ class_name: newClass }).eq('id', userId)
    // Nếu chuyển học sinh sang lớp khác, có thể cần reload lại để danh sách biến mất (với GV)
    if (currentUser.role === 'TEACHER' && newClass !== currentUser.class_name) {
        alert("Đã chuyển học sinh sang lớp khác!")
        fetchData()
    }
  }

  const handleAddClass = async () => {
    if (!newClassName.trim()) return alert("Vui lòng nhập tên lớp!")
    setLoading(true)
    const { error } = await supabase.from('classes').insert({ name: newClassName.toUpperCase() })
    if (error) alert("Lỗi: " + error.message); else { alert(`✅ Đã thêm lớp ${newClassName}`); setNewClassName(''); fetchData() }
    setLoading(false)
  }

  const handleDeleteClass = async (id: number) => {
    if (!confirm("Xóa lớp này?")) return
    const { error } = await supabase.from('classes').delete().eq('id', id)
    if (error) alert("Không thể xóa lớp đang có học sinh!"); else fetchData()
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId); fetchData() 
  }

  const handleUpdateGroup = async (userId: string, newGroup: number) => {
    await supabase.from('profiles').update({ group_number: newGroup }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, group_number: newGroup } : u))
  }

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Xóa vĩnh viễn "${user.full_name}"?`)) return
    setLoading(true)
    try {
      await supabase.from('point_logs').delete().eq('student_id', user.id)
      await supabase.from('point_logs').delete().eq('actor_id', user.id)
      await supabase.from('redemptions').delete().eq('student_id', user.id)
      const { error } = await supabase.from('profiles').delete().eq('id', user.id)
      if (error) throw error; alert("Đã xóa thành công!"); fetchData()
    } catch (error: any) { alert("Lỗi: " + error.message) } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* KHU VỰC 1: QUẢN LÝ LỚP (Chỉ Admin mới được thêm/xóa lớp) */}
      <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
        <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">🏫 Danh Sách Lớp Học</h2>
        
        {currentUser.role === 'SUPER_ADMIN' && (
            <div className="flex gap-2 mb-4">
            <input type="text" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="Tên lớp mới (VD: 6A1)..." className="border-2 border-blue-200 p-2 rounded-lg outline-none focus:border-blue-500 w-64" />
            <button onClick={handleAddClass} disabled={loading} className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">+ Thêm</button>
            </div>
        )}

        <div className="flex flex-wrap gap-2">
          {classes.map(c => (
            <div key={c.id} className={`px-3 py-1 rounded-full border flex items-center gap-2 text-sm font-bold ${currentUser.class_name === c.name ? 'bg-green-100 text-green-800 border-green-300 ring-2 ring-green-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
              {c.name} 
              {currentUser.role === 'SUPER_ADMIN' && <button onClick={() => handleDeleteClass(c.id)} className="text-red-400 hover:text-red-600 font-black text-xs">×</button>}
            </div>
          ))}
        </div>
      </div>

      {/* KHU VỰC 2: DANH SÁCH THÀNH VIÊN */}
      <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h2 className="text-xl font-bold text-purple-700 flex items-center gap-2">👥 Danh Sách {currentUser.role === 'SUPER_ADMIN' ? 'Toàn Trường' : `Lớp ${currentUser.class_name}`} ({filteredUsers.length})</h2>
          <div className="relative w-full md:w-72">
            <input type="text" placeholder="🔍 Tìm tên, tổ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border-2 border-purple-200 p-2 pl-4 rounded-full outline-none focus:border-purple-500 text-sm font-bold text-gray-700" />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold">✕</button>}
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-purple-50 text-purple-800 uppercase text-xs sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-3 border-b">Họ Tên</th>
                <th className="p-3 border-b">Lớp</th>
                <th className="p-3 border-b">Chức Vụ</th>
                <th className="p-3 border-b w-24 text-center">Tổ</th>
                <th className="p-3 border-b text-center">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${user.role === 'SUPER_ADMIN' ? 'bg-red-50' : ''}`}>
                  <td className="p-3 font-bold text-gray-700">
                    {user.full_name}
                    {user.role === 'SUPER_ADMIN' && <span className="ml-2 text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded">BOSS</span>}
                  </td>
                  
                  {/* Cột Lớp: Admin được sửa, GV chỉ được xem */}
                  <td className="p-3">
                    {currentUser.role === 'SUPER_ADMIN' ? (
                        <select value={user.class_name || ''} onChange={(e) => handleUpdateClass(user.id, e.target.value)} className="p-1.5 rounded border text-xs font-bold cursor-pointer bg-white text-purple-700 border-purple-300 hover:border-purple-500">
                        <option value="">-- Chọn --</option>
                        {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    ) : (
                        <span className="text-gray-500 font-medium">{user.class_name || '---'}</span>
                    )}
                  </td>

                  <td className="p-3">
                    {user.role === 'SUPER_ADMIN' ? (
                      <span className="font-black text-red-600 flex items-center gap-1">👑 QUẢN TRỊ</span>
                    ) : (
                      <select value={user.role} onChange={(e) => handleUpdateRole(user.id, e.target.value)} className={`p-1.5 rounded border text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 ${user.role === 'TEACHER' ? 'bg-purple-100 text-purple-700 border-purple-200' : user.role === 'MONITOR' ? 'bg-blue-50 text-blue-700 border-blue-200' : user.role === 'GROUP_LEADER' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-white text-gray-600'}`}>
                        <option value="STUDENT">Học Sinh</option>
                        <option value="GROUP_LEADER">⭐ Tổ Trưởng</option>
                        <option value="MONITOR">🛡️ Lớp Trưởng</option>
                        <option value="TEACHER">🎓 Giáo Viên</option>
                      </select>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <input type="number" min="0" max="10" value={user.group_number || 0} onChange={(e) => handleUpdateGroup(user.id, parseInt(e.target.value))} disabled={user.role === 'SUPER_ADMIN' || user.role === 'TEACHER'} className="w-12 p-1.5 border rounded text-center font-bold text-blue-600 focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:text-gray-400" />
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleDeleteUser(user)} disabled={loading || user.role === 'SUPER_ADMIN'} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors disabled:opacity-20 disabled:cursor-not-allowed">🗑️</button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">Không tìm thấy kết quả nào.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}