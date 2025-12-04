"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ClassSelection({ currentUser, onUpdate }: { currentUser: any, onUpdate: () => void }) {
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [loading, setLoading] = useState(false)
  const [newClassName, setNewClassName] = useState('') // Cho Super Admin tạo lớp

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase.from('classes').select('*').order('name', { ascending: true })
      if (data) {
        setClasses(data)
        if (data.length > 0) setSelectedClass(data[0].name)
      }
    }
    fetchClasses()
  }, [])

  const handleJoinClass = async () => {
    setLoading(true)
    const { error } = await supabase.from('profiles').update({ class_name: selectedClass }).eq('id', currentUser.id)
    if (!error) {
      alert(`✅ Chào mừng bạn đến với lớp ${selectedClass}!`)
      window.location.reload()
    } else {
      alert(error.message)
    }
    setLoading(false)
  }

  // Chỉ Super Admin mới được tạo lớp mới
  const handleCreateClass = async () => {
    if (!newClassName) return
    const { error } = await supabase.from('classes').insert({ name: newClassName })
    if (!error) {
      alert("Đã tạo lớp mới!")
      window.location.reload()
    } else {
      alert(error.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-blue-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border-2 border-blue-100">
        <h1 className="text-2xl font-black text-blue-900 mb-2 uppercase">Chọn Lớp Học</h1>
        <p className="text-gray-500 mb-6 text-sm">Vui lòng chọn lớp bạn đang giảng dạy hoặc theo học.</p>

        <div className="mb-6">
          <label className="block text-left text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Danh sách lớp</label>
          <select 
            className="w-full p-3 border-2 border-blue-200 rounded-xl font-bold text-gray-700 outline-none focus:border-blue-500"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <button 
          onClick={handleJoinClass} 
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700 transition-transform active:scale-95"
        >
          {loading ? 'Đang vào lớp...' : 'Vào Lớp Ngay 🚀'}
        </button>

        {/* Khu vực tạo lớp cho Super Admin */}
        {currentUser.role === 'SUPER_ADMIN' && (
          <div className="mt-8 pt-6 border-t border-dashed border-gray-200">
             <p className="text-xs font-bold text-red-500 uppercase mb-2">Khu vực Quản trị viên</p>
             <div className="flex gap-2">
               <input 
                 className="flex-1 p-2 border rounded text-sm" 
                 placeholder="Tên lớp mới (VD: 9A1)" 
                 value={newClassName}
                 onChange={e => setNewClassName(e.target.value)}
               />
               <button onClick={handleCreateClass} className="bg-green-600 text-white px-3 rounded font-bold text-sm">Tạo</button>
             </div>
          </div>
        )}
      </div>
    </div>
  )
}