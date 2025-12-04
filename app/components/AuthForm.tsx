"use client"
import { createClient } from '@supabase/supabase-js'
import { useState } from 'react'

// Khởi tạo Supabase client (giữ nguyên)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getFakeEmail = (user: string) => `${user.toLowerCase().replace(/\s/g, '')}@hocsinh.com`

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fakeEmail = getFakeEmail(username)

    try {
      if (isLogin) {
        // --- ĐĂNG NHẬP ---
        const { error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password })
        if (error) throw new Error("Sai tên đăng nhập hoặc mật khẩu!")
        window.location.reload()
      } else {
        // --- ĐĂNG KÝ ---
        if (!fullName) throw new Error("Vui lòng nhập Họ và Tên thật!")
        if (username.length < 3) throw new Error("Tên đăng nhập phải dài hơn 3 ký tự")
        if (password.length < 6) throw new Error("Mật khẩu phải từ 6 ký tự trở lên")

        const { error } = await supabase.auth.signUp({
          email: fakeEmail,
          password,
          options: { data: { full_name: fullName } }
        })
        
        if (error) throw error
        alert("🎉 Đăng ký thành công! Đang vào lớp...")
        window.location.reload()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border-2 border-blue-100">
        
        {/* --- PHẦN HEADER MỚI (LOGO & TÊN TRƯỜNG) --- */}
        <div className="flex flex-col items-center mb-6">
          {/* Ảnh Logo */}
          {/* LƯU Ý: Đảm bảo bạn đã để file 'logo-truong.jpg' trong thư mục 'public' */}
          <img 
            src="/logo-truong.jpg" 
            alt="Logo THCS Đằng Lâm" 
            className="w-24 h-24 object-contain mb-2 rounded-full border-2 border-blue-50"
          />
          
          {/* Tên Trường Cố Định */}
          <h1 className="text-2xl font-black text-center text-blue-800 uppercase leading-tight">
            THCS Đằng Lâm
          </h1>
          
          {/* Dòng trạng thái động */}
          <p className="text-center text-blue-600 font-bold text-lg">
            {isLogin ? 'Cổng Đăng Nhập' : 'Đăng Ký Nhập Học'}
          </p>
          <p className="text-center text-gray-400 text-xs mt-1">Hệ thống Thi đua & Đổi quà</p>
        </div>
        {/* --- HẾT PHẦN HEADER MỚI --- */}


        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          
          {/* Ô nhập Họ Tên Thật (Chỉ hiện khi Đăng ký) */}
          {!isLogin && (
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Họ và Tên thật</label>
              <input 
                className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-blue-500 outline-none font-bold text-gray-700"
                type="text" placeholder="VD: Nguyễn Văn A" value={fullName} onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          {/* Ô nhập Tên Đăng Nhập */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tên đăng nhập (Viết liền)</label>
            <input 
              className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-blue-500 outline-none font-bold text-blue-900"
              type="text" placeholder="VD: nam123" value={username} onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Ô nhập Mật khẩu */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Mật khẩu</label>
            <input 
              className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-blue-500 outline-none font-bold"
              type="password" placeholder="••••••" value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="bg-red-100 text-red-600 text-sm font-bold p-3 rounded text-center border border-red-200">⚠️ {error}</div>}

          <button disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-300 transition-transform active:scale-95 mt-2">
            {loading ? 'Đang xử lý...' : (isLogin ? 'Vào Lớp Ngay 🚀' : 'Đăng Ký Tài Khoản ✨')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button onClick={() => { setIsLogin(!isLogin); setError('') }} className="text-gray-500 hover:text-blue-600 font-medium">
            {isLogin ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có nick rồi? Đăng nhập"}
          </button>
        </div>
      </div>
    </div>
  )
}