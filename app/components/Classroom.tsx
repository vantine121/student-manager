"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Shop from './Shop'
import AdminShop from './AdminShop'
import TeacherDashboard from './TeacherDashboard'
import Podium from './Podium'
import ExcelTable from './ExcelTable'
import ProfileModal from './ProfileModal'
import ClassSelection from './ClassSelection'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Classroom({ initialStudents, userSessionId }: { initialStudents: any[], userSessionId: string }) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // Tab mặc định
  const [activeTab, setActiveTab] = useState<'list' | 'ranking' | 'shop' | 'admin' | 'dashboard'>('list')
  const [selectedGroup, setSelectedGroup] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // State cho danh sách lớp (để truyền xuống ExcelTable cho Admin lọc)
  const [classes, setClasses] = useState<any[]>([])

  // State cho Menu và Modal
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  // 1. Tải thông tin người dùng hiện tại
  const refreshUser = async () => {
    if (!userSessionId) return
    const { data } = await supabase.from('profiles').select('*').eq('id', userSessionId).single()
    if (data) setCurrentUser(data)
  }

  // 2. Tải danh sách các lớp học (Chỉ cần tải 1 lần)
  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase.from('classes').select('*').order('name', { ascending: true })
      if (data) setClasses(data)
    }
    fetchClasses()
    refreshUser()
  }, [userSessionId])

  // 3. Lọc danh sách học sinh theo Lớp của người dùng
  const classStudents = initialStudents.filter(s => {
    if (!currentUser?.class_name) return false
    // Nếu là SUPER_ADMIN: Lấy hết (để xuống ExcelTable lọc sau)
    if (currentUser.role === 'SUPER_ADMIN') return true
    // Nếu là GV/HS: Chỉ lấy người cùng lớp
    return s.class_name === currentUser.class_name
  })

  // 4. Danh sách cho Bảng Xếp Hạng (Sắp xếp điểm cao -> thấp)
  const sortedStudents = [...classStudents]
    .filter(s => s.role !== 'TEACHER' && s.role !== 'SUPER_ADMIN') // Bỏ GV và Admin ra khỏi BXH
    .sort((a, b) => b.current_points - a.current_points)

  // Hàm chọn tổ
  const handleConfirmGroup = async () => {
    if (!currentUser) return
    if (!confirm(`Xác nhận vào TỔ ${selectedGroup}?`)) return
    setLoading(true)
    const { error } = await supabase.from('profiles').update({ group_number: selectedGroup, is_group_locked: true }).eq('id', currentUser.id)
    if (!error) { alert("✅ Đã chốt tổ!"); window.location.reload() } 
    else alert("Lỗi: " + error.message)
    setLoading(false)
  }

  // Hàm Đăng xuất
  const handleLogout = async () => { 
    await supabase.auth.signOut() 
    window.location.reload() 
  }

  // Hàm hiển thị Rank đẹp
  const getFullRankBadge = (pts: number) => {
    if (pts >= 400) return <span className="bg-yellow-100 text-yellow-800 border border-yellow-400 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">👑 Trùm Cuối</span>
    if (pts >= 300) return <span className="bg-purple-100 text-purple-800 border border-purple-400 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">🔮 Thần Đồng</span>
    if (pts >= 200) return <span className="bg-pink-100 text-pink-800 border border-pink-400 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">🧠 Học Bá</span>
    if (pts >= 100) return <span className="bg-blue-100 text-blue-800 border border-blue-400 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">🌟 Sao Sáng</span>
    return <span className="bg-gray-100 text-gray-600 border border-gray-300 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">🌱 Tân Binh</span>
  }

  // Hàm hiển thị Avatar (Ảnh thật hoặc Chữ cái)
  const getAvatarDisplay = () => {
    if (currentUser?.avatar_code) {
      let set = 'set1'; if (currentUser.avatar_code.startsWith('monster')) set = 'set2'; if (currentUser.avatar_code.startsWith('cat')) set = 'set4';
      return <img src={`https://robohash.org/${currentUser.avatar_code}.png?set=${set}&size=100x100`} className="w-full h-full object-cover" />
    }
    return currentUser?.full_name?.charAt(0)
  }

  // Component Nút Menu
  const NavButton = ({ tab, label, icon }: { tab: any, label: string, icon: string }) => (
    <button onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'}`}><span>{icon}</span> {label}</button>
  )

  // --- KIỂM TRA TRẠNG THÁI TRƯỚC KHI RENDER ---
  
  // 1. Chưa tải xong user
  if (!currentUser) return <div className="min-h-screen flex items-center justify-center font-bold text-blue-600 animate-pulse">⏳ Đang tải dữ liệu...</div>
  
  // 2. Chưa chọn lớp (Và không phải Admin đang trong chế độ quản lý) -> Hiện màn hình chọn lớp
  // Lưu ý: Super Admin có thể vào đây để đổi lớp quản lý nếu muốn
  if (!currentUser.class_name) {
    return <ClassSelection currentUser={currentUser} onUpdate={refreshUser} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* MODAL PROFILE */}
      {showProfile && <ProfileModal currentUser={currentUser} onClose={() => setShowProfile(false)} onUpdate={refreshUser} />}
      
      {/* HEADER CỐ ĐỊNH */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* TRÁI: LOGO & MENU */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo-truong.jpg" alt="Logo" className="w-12 h-12 rounded-full object-cover border-2 border-blue-100 shadow-sm" />
              <div className="hidden md:block"><h1 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Trường THCS</h1><h2 className="text-lg font-black text-blue-900 uppercase leading-none">ĐẰNG LÂM</h2></div>
            </div>
            <nav className="hidden md:flex gap-1">
              <NavButton tab="list" label="Sổ Thi Đua" icon="📝" />
              <NavButton tab="ranking" label="BXH" icon="🏆" />
              <NavButton tab="shop" label="Shop Quà" icon="🎁" />
              
              {/* Menu riêng cho GV và Admin */}
              {(currentUser.role === 'TEACHER' || currentUser.role === 'SUPER_ADMIN') && (
                <>
                  <div className="w-[1px] h-6 bg-gray-300 mx-2 self-center"></div>
                  <NavButton tab="dashboard" label="Quản Lý Lớp" icon="🔔" />
                </>
              )}
              
              {/* Menu riêng cho Admin */}
              {currentUser.role === 'SUPER_ADMIN' && <NavButton tab="admin" label="Kho Quà (Admin)" icon="🛠️" />}
            </nav>
          </div>

          {/* PHẢI: THÔNG TIN CÁ NHÂN */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
               <span className="text-[9px] text-gray-400 font-bold uppercase">Số dư</span>
               <span className="text-lg font-black text-yellow-500 leading-none">{currentUser.wallet_coins || 0} 💰</span>
            </div>
            
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200 relative">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-800 leading-tight">{currentUser.full_name}</p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                   {/* Nhãn Chức Vụ */}
                   {currentUser.role === 'SUPER_ADMIN' && <span className="text-[9px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded border border-red-700">QUẢN TRỊ VIÊN</span>}
                   {currentUser.role === 'TEACHER' && <span className="text-[9px] font-black text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200">GVCN {currentUser.class_name}</span>}
                   
                   {/* Nhãn Lớp & Rank (Cho Học Sinh) */}
                   {currentUser.role !== 'TEACHER' && currentUser.role !== 'SUPER_ADMIN' && (
                      <>
                        <span className="text-[9px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Lớp {currentUser.class_name}</span>
                        {getFullRankBadge(currentUser.current_points)}
                      </>
                   )}
                </div>
              </div>
              
              {/* Avatar Clickable */}
              <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-gray-500 bg-gray-200 overflow-hidden relative shadow-sm cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all 
                ${currentUser?.frame_type === 'GOLD' ? 'frame-gold' : currentUser?.frame_type === 'SILVER' ? 'frame-silver' : currentUser?.frame_type === 'BRONZE' ? 'frame-bronze' : 'border-2 border-white'}`}>
                {getAvatarDisplay()}
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-xl shadow-xl w-48 overflow-hidden z-50 animate-fade-in-down">
                  <div className="p-3 border-b bg-gray-50 md:hidden">
                    <p className="text-sm font-bold truncate">{currentUser.full_name}</p>
                    <p className="text-xs text-yellow-600 font-bold">{currentUser.wallet_coins} 💰</p>
                  </div>
                  <button onClick={() => { setShowProfile(true); setIsDropdownOpen(false) }} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2">👤 Trang Cá Nhân</button>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t">🚪 Đăng Xuất</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Menu Mobile */}
        <div className="md:hidden flex overflow-x-auto gap-2 p-2 border-t bg-gray-50 scrollbar-hide">
          <NavButton tab="list" label="Sổ" icon="📝" />
          <NavButton tab="ranking" label="BXH" icon="🏆" />
          <NavButton tab="shop" label="Quà" icon="🎁" />
          {(currentUser.role === 'TEACHER' || currentUser.role === 'SUPER_ADMIN') && <NavButton tab="dashboard" label="QL" icon="🔔" />}
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto w-full p-4 md:p-6 flex-1 relative">
        
        {/* Cảnh báo chọn tổ (Chỉ hiện với HS chưa có tổ) */}
        {currentUser.role !== 'TEACHER' && currentUser.role !== 'SUPER_ADMIN' && (!currentUser.is_group_locked || !currentUser.group_number) && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm animate-pulse">
            <div className="flex items-center gap-3"><span className="text-2xl">⚠️</span><div><h3 className="text-red-800 font-bold uppercase text-sm">Chưa chọn tổ</h3><p className="text-red-600 text-xs">Vui lòng chọn tổ để bắt đầu.</p></div></div>
            <div className="flex gap-2">
              <select className="p-2 border border-red-300 rounded text-sm font-bold outline-none" value={selectedGroup} onChange={(e) => setSelectedGroup(parseInt(e.target.value))}>{[1,2,3,4,5,6,7,8].map(n=><option key={n} value={n}>Tổ {n}</option>)}</select>
              <button onClick={handleConfirmGroup} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded text-sm shadow-sm">{loading ? '...' : 'XÁC NHẬN'}</button>
            </div>
          </div>
        )}

        {/* 1. SỔ THI ĐUA (EXCEL) */}
        {activeTab === 'list' && (
          <div className="animate-fade-in">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                📝 Sổ Theo Dõi 
                <span className="text-xs font-normal text-gray-500 bg-gray-200 px-3 py-1 rounded-full border border-gray-300">
                  {currentUser.role === 'SUPER_ADMIN' ? 'Toàn Trường' : `Lớp ${currentUser.class_name}`}
                </span>
              </h2>
            </div>
            <ExcelTable 
              students={classStudents.filter(s => s.role !== 'TEACHER' && s.role !== 'SUPER_ADMIN')} 
              currentUser={currentUser}
              classes={classes} // Truyền danh sách lớp xuống
            />
          </div>
        )}
        
        {/* 2. BẢNG XẾP HẠNG */}
        {activeTab === 'ranking' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch animate-fade-in">
            <div className="lg:col-span-3 w-full sticky top-24"><Podium topStudents={sortedStudents.slice(0, 3)} /></div>
            <div className="lg:col-span-2 bg-white p-0 rounded-xl shadow-lg border border-gray-200 h-full max-h-[650px] flex flex-col overflow-hidden"><div className="p-4 border-b bg-gray-50 flex justify-between items-center"><h2 className="font-bold text-gray-700 uppercase text-sm">📉 Bảng Tổng Sắp</h2><span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold border border-green-200">Live Update</span></div><div className="flex flex-col overflow-y-auto custom-scrollbar flex-1 p-2">{sortedStudents.map((student, index) => (<div key={student.id} className="flex items-center justify-between p-3 rounded-lg border-b border-gray-50 hover:bg-blue-50 transition-colors group"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-sm ${index===0?'bg-yellow-400 text-white':index===1?'bg-gray-400 text-white':index===2?'bg-orange-400 text-white':'bg-gray-100 text-gray-500'}`}>{index+1}</div><div className="flex flex-col"><p className="font-bold text-gray-800 text-sm group-hover:text-blue-700 transition-colors">{student.full_name}</p><div className="mt-1 scale-90 origin-left">{getFullRankBadge(student.current_points)}</div></div></div><div className="text-right"><span className="block font-black text-lg text-blue-900">{student.current_points}</span></div></div>))}</div></div>
          </div>
        )}

        {/* 3. SHOP QUÀ */}
        {activeTab === 'shop' && <Shop currentUser={currentUser} onUpdate={refreshUser} />}
        
        {/* 4. NHẬP HÀNG (ADMIN) */}
        {activeTab === 'admin' && currentUser.role === 'SUPER_ADMIN' && <AdminShop />}
        
        {/* 5. QUẢN LÝ (GV & ADMIN) */}
        {activeTab === 'dashboard' && (currentUser.role === 'TEACHER' || currentUser.role === 'SUPER_ADMIN') && <TeacherDashboard />}
      </main>
    </div>
  )
}