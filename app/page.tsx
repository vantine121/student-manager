"use client"
import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import AuthForm from './components/AuthForm' // Gọi form đăng nhập
import Classroom from './components/Classroom'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Home() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<any[]>([])

  useEffect(() => {
    // Kiểm tra xem đã đăng nhập chưa
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchData()
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchData()
      else setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchData = async () => {
    const { data } = await supabase.from('profiles').select('*').order('group_number', { ascending: true })
    if (data) setStudents(data)
    setLoading(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-blue-600">🚀 Đang kết nối...</div>

  // QUAN TRỌNG: Nếu chưa đăng nhập thì hiện Form
  if (!session) return <AuthForm />

  // Đã đăng nhập thì hiện Lớp học
  return (
    <div>
      <div className="absolute top-4 right-4 z-50">
        <button onClick={() => supabase.auth.signOut()} className="bg-gray-800 text-white text-xs px-3 py-1 rounded hover:bg-black">Đăng xuất</button>
      </div>
      <Classroom initialStudents={students} userSessionId={session.user.id} />
    </div>
  )
}