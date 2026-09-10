"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BADGES = [
  { id: 'NEWBIE', icon: '🐣', name: 'Tân Binh', desc: 'Gia nhập lớp học lần đầu', condition: (u: any) => true },
  { id: 'FASHION', icon: '🎩', name: 'Biết Ăn Diện', desc: 'Đã đổi Avatar mới', condition: (u: any) => u.avatar_code && u.avatar_code !== null },
  { id: 'GOOD_STUDENT', icon: '📘', name: 'Trò Ngoan', desc: 'Đạt mốc 110 điểm', condition: (u: any) => u.current_points >= 110 },
  { id: 'HARD_WORK', icon: '🐝', name: 'Ong Chăm Chỉ', desc: 'Đạt mốc 150 điểm', condition: (u: any) => u.current_points >= 150 },
  { id: 'SAVER', icon: '🐷', name: 'Heo Đất', desc: 'Tích lũy được 500 Xu', condition: (u: any) => u.wallet_coins >= 500 },
  { id: 'FRAME_USER', icon: '🖼️', name: 'Sành Điệu', desc: 'Đang đeo khung Avatar bất kỳ', condition: (u: any) => u.frame_type && u.frame_type !== 'NONE' },
  { id: 'ELITE', icon: '🚀', name: 'Tinh Anh', desc: 'Đạt mốc 200 điểm', condition: (u: any) => u.current_points >= 200 },
  { id: 'RICH_KID', icon: '💎', name: 'Đại Gia', desc: 'Tích lũy được 2000 Xu', condition: (u: any) => u.wallet_coins >= 2000 },
  { id: 'LEADER', icon: '📢', name: 'Lãnh Đạo', desc: 'Là Tổ Trưởng hoặc Lớp Trưởng', condition: (u: any) => u.role === 'GROUP_LEADER' || u.role === 'MONITOR' },
  { id: 'GENIUS', icon: '🔮', name: 'Thần Đồng', desc: 'Đạt mốc 300 điểm', condition: (u: any) => u.current_points >= 300 },
  { id: 'LEGEND', icon: '👑', name: 'Trùm Cuối', desc: 'Đạt mốc 400 điểm tuyệt đối', condition: (u: any) => u.current_points >= 400 },
  { id: 'GOLDEN_BOSS', icon: '🐲', name: 'Hoàng Kim', desc: 'Sở hữu khung Rồng Vàng', condition: (u: any) => u.frame_type === 'GOLD' }
]

const AVATAR_LIST = ['robot01', 'robot02', 'robot03', 'robot04', 'monster01', 'monster02', 'monster03', 'monster04', 'cat01', 'cat02', 'cat03', 'cat04', 'cat05', 'cat06']

export default function ProfileModal({ currentUser, onClose, onUpdate }: { currentUser: any, onClose: () => void, onUpdate: () => void }) {
  const [activeTab, setActiveTab] = useState<'info' | 'inventory' | 'badges' | 'password'>('info')
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatar_code)
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [myBadges, setMyBadges] = useState<string[]>(currentUser.unlocked_badges || [])
  const [myItems, setMyItems] = useState<any[]>([])

  // --- SỬA LỖI: LẤY DANH SÁCH KHUNG TỪ DATABASE ---
  // Tạo danh sách khung gồm: Mặc định (NONE) + Các khung đã mua
  const myFrames = Array.from(new Set(['NONE', ...(currentUser.owned_frames || [])]))

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase.from('redemptions').select('*, rewards(*)').eq('student_id', currentUser.id).order('created_at', { ascending: false })
      if (data) setMyItems(data)
    }
    fetchItems()
  }, [])

  useEffect(() => {
    const checkAchievements = async () => {
      let newUnlocks: string[] = [...myBadges]; let newRewardCoins = 0; let hasChange = false
      BADGES.forEach(badge => { if (!newUnlocks.includes(badge.id) && badge.condition(currentUser)) { newUnlocks.push(badge.id); newRewardCoins += 10; hasChange = true } })
      if (hasChange) {
        await supabase.from('profiles').update({ unlocked_badges: newUnlocks, wallet_coins: (currentUser.wallet_coins || 0) + newRewardCoins }).eq('id', currentUser.id)
        setMyBadges(newUnlocks)
        alert(`🎉 Bạn nhận được +${newRewardCoins} Xu từ Huy Hiệu mới!`); onUpdate()
      }
    }
    checkAchievements()
  }, [])

  const handleSaveAvatar = async () => {
    setLoading(true)
    const { error } = await supabase.from('profiles').update({ avatar_code: selectedAvatar }).eq('id', currentUser.id)
    setLoading(false)
    if (error) alert("Lỗi: " + error.message); else { alert("✅ Đã đổi Avatar!"); onUpdate() }
  }

  const handleChangeFrame = async (frameIdentifier: string) => {
    if (!confirm("Đổi sang khung này?")) return
    
    let updateData: any = {}
    
    // Kiểm tra loại khung để lưu đúng cột
    if (['GOLD', 'SILVER', 'BRONZE', 'NONE'].includes(frameIdentifier)) {
        updateData.frame_type = frameIdentifier
        updateData.frame_url = null
    } else {
        updateData.frame_type = 'CUSTOM'
        updateData.frame_url = frameIdentifier // Lưu link ảnh
    }

    await supabase.from('profiles').update(updateData).eq('id', currentUser.id)
    alert("✅ Đã đổi khung thành công!")
    onUpdate()
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) return alert("Mật khẩu ngắn quá!")
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (error) alert("Lỗi: " + error.message); else { alert("✅ Đổi mật khẩu thành công!"); setNewPassword('') }
  }

  const getAvatarUrl = (code: string) => {
    let set = 'set1'; if (code?.startsWith('monster')) set = 'set2'; if (code?.startsWith('cat')) set = 'set4';
    return `https://robohash.org/${code}.png?set=${set}&size=150x150`
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 animate-fade-in pt-24 overflow-y-auto">
      
      <div className="bg-white w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* HEADER */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm shrink-0">
          <h2 className="text-xl font-black text-blue-900 uppercase flex items-center gap-2">
            👤 Hồ Sơ Cá Nhân
          </h2>
          <button onClick={onClose} className="bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-500 font-bold p-2 rounded-full transition-all w-10 h-10 flex items-center justify-center">✕</button>
        </div>

        {/* BODY */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* CỘT TRÁI */}
          <div className="w-full md:w-1/3 lg:w-1/4 bg-gray-50 border-r border-gray-200 flex flex-col gap-6 p-6 overflow-y-auto custom-scrollbar">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center text-center relative">
               
               {/* AVATAR HIỆN TẠI */}
               <div className="relative w-24 h-24 flex items-center justify-center mb-3">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-50 border-2 border-white shadow-inner">
                     <img src={getAvatarUrl(selectedAvatar || 'robot01')} className="w-full h-full object-cover" />
                  </div>
                  {/* Khung ảnh */}
                  {currentUser.frame_type === 'CUSTOM' && currentUser.frame_url && (
                     <img src={currentUser.frame_url} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] object-contain pointer-events-none" />
                  )}
                  {/* Khung màu */}
                  {['GOLD', 'SILVER', 'BRONZE'].includes(currentUser.frame_type) && (
                     <div className={`absolute inset-0 rounded-full pointer-events-none ${currentUser.frame_type === 'GOLD' ? 'frame-gold' : currentUser.frame_type === 'SILVER' ? 'frame-silver' : 'frame-bronze'}`}></div>
                  )}
               </div>

               <h3 className="text-lg font-black text-gray-800 leading-tight">{currentUser.full_name}</h3>
               <p className="text-xs font-bold text-gray-500 uppercase mt-1">{currentUser.role === 'TEACHER' ? 'GIÁO VIÊN' : `TỔ ${currentUser.group_number}`}</p>
               <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-full border border-yellow-200 shadow-sm">💰 {currentUser.wallet_coins} Xu</span>
               </div>
            </div>

            <div className="flex flex-col gap-1">
              <button onClick={() => setActiveTab('info')} className={`w-full text-left px-4 py-3 font-bold text-sm rounded-lg flex items-center gap-3 transition-all ${activeTab === 'info' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}>🎨 Đổi Avatar</button>
              <button onClick={() => setActiveTab('inventory')} className={`w-full text-left px-4 py-3 font-bold text-sm rounded-lg flex items-center gap-3 transition-all ${activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}>🎒 Kho Đồ & Khung</button>
              <button onClick={() => setActiveTab('badges')} className={`w-full text-left px-4 py-3 font-bold text-sm rounded-lg flex items-center gap-3 transition-all ${activeTab === 'badges' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}>🏅 Huy Hiệu</button>
              <button onClick={() => setActiveTab('password')} className={`w-full text-left px-4 py-3 font-bold text-sm rounded-lg flex items-center gap-3 transition-all ${activeTab === 'password' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}>🔒 Mật Khẩu</button>
            </div>
          </div>

          {/* CỘT PHẢI */}
          <div className="flex-1 bg-white p-6 md:p-8 overflow-y-auto custom-scrollbar">
            
            {activeTab === 'info' && (
              <div className="animate-fade-in">
                <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Chọn Gương Mặt Đại Diện</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {AVATAR_LIST.map(code => (<div key={code} onClick={() => setSelectedAvatar(code)} className={`aspect-square rounded-xl border-4 overflow-hidden cursor-pointer transition-all hover:scale-105 relative bg-gray-50 ${selectedAvatar === code ? 'border-blue-500 ring-4 ring-blue-100' : 'border-transparent hover:border-blue-200'}`}><img src={getAvatarUrl(code)} className="w-full h-full object-cover" />{selectedAvatar === code && <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">✓</div>}</div>))}
                </div>
                <div className="mt-8 flex justify-end"><button onClick={handleSaveAvatar} disabled={loading} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg active:scale-95 disabled:opacity-50">{loading ? '...' : 'Lưu Thay Đổi'}</button></div>
              </div>
            )}

            {/* --- TAB KHO ĐỒ (HIỂN THỊ TẤT CẢ KHUNG ĐANG CÓ) --- */}
            {activeTab === 'inventory' && (
              <div className="animate-fade-in space-y-10">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">🖼️ Bộ Sưu Tập Khung Avatar</h3>
                  <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
                    
                    {/* VÒNG LẶP MỚI: Duyệt qua danh sách myFrames */}
                    {myFrames.map((frame: any) => {
                      // Kiểm tra đang đeo khung nào
                      const isEquipped = (frame === 'NONE' && currentUser.frame_type === 'NONE') || 
                                         (frame === currentUser.frame_type) || 
                                         (currentUser.frame_type === 'CUSTOM' && currentUser.frame_url === frame)

                      return (
                        <div key={frame} onClick={() => handleChangeFrame(frame)} 
                          className={`flex-shrink-0 w-32 h-48 border-2 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:scale-105 shadow-sm
                          ${isEquipped ? 'border-green-500 bg-green-50 ring-4 ring-green-100' : 'border-gray-200 hover:border-blue-300'}`}>
                          
                          <div className="relative w-16 h-16 flex items-center justify-center">
                             <div className={`w-14 h-14 rounded-full bg-gray-200 border-2 border-white ${frame === 'GOLD' ? 'frame-gold' : frame === 'SILVER' ? 'frame-silver' : frame === 'BRONZE' ? 'frame-bronze' : ''}`}></div>
                             
                             {/* Nếu là link ảnh (có chứa http) thì hiển thị ảnh */}
                             {frame.includes('http') && (
                               <img src={frame} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] object-contain pointer-events-none" />
                             )}
                          </div>

                          <span className="text-xs font-bold uppercase truncate w-full text-center px-2">
                             {frame === 'NONE' ? 'Mặc định' : frame.includes('http') ? 'Khung Ảnh' : `Khung ${frame}`}
                          </span>
                          {isEquipped && <span className="text-[10px] bg-green-600 text-white px-3 py-1 rounded-full">Đang dùng</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Túi đồ */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">🎒 Túi Đồ</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {myItems.map(item => (
                      <div key={item.id} className="border p-4 rounded-xl flex justify-between items-center bg-gray-50 hover:bg-white transition-colors">
                        <div className="flex items-center gap-4"><div className="text-3xl bg-white p-2 rounded-lg shadow-sm border">{item.rewards?.image_url ? <img src={item.rewards.image_url} className="w-10 h-10 object-contain" /> : '🎁'}</div><div><p className="font-bold text-gray-800">{item.rewards?.name || 'Vật phẩm đã xóa'}</p><p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString('vi-VN')}</p></div></div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${item.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.status === 'DELIVERED' ? 'Đã Nhận' : 'Chờ Duyệt'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'badges' && (
              <div className="animate-fade-in">
                <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Thành Tựu</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {BADGES.map(badge => {
                    const isUnlocked = myBadges.includes(badge.id)
                    return (<div key={badge.id} className={`border-2 rounded-2xl p-6 flex flex-col items-center text-center transition-all ${isUnlocked ? 'bg-yellow-50 border-yellow-400 shadow-md scale-105' : 'bg-gray-50 border-gray-100 opacity-60 grayscale'}`}><div className="text-6xl mb-4 transform transition-transform hover:scale-110 drop-shadow-sm">{badge.icon}</div><h4 className="font-black text-gray-800">{badge.name}</h4><p className="text-xs text-gray-500 mt-2 mb-4 h-8">{badge.desc}</p>{isUnlocked ? <span className="text-[10px] font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200">✅ ĐÃ NHẬN</span> : <span className="text-[10px] font-bold text-gray-400 bg-gray-200 px-3 py-1 rounded-full">🔒 CHƯA ĐẠT</span>}</div>)
                  })}
                </div>
              </div>
            )}

            {activeTab === 'password' && (<div className="animate-fade-in max-w-md"><h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Bảo Mật</h3><div className="space-y-4"><div><label className="block text-sm font-bold text-gray-600 mb-2">Mật khẩu mới</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-blue-500 transition-colors" placeholder="Nhập ít nhất 6 ký tự..." /></div><button onClick={handleChangePassword} disabled={loading} className="w-full bg-red-500 text-white font-bold py-3 rounded-xl shadow-md hover:bg-red-600 disabled:opacity-50">{loading ? '...' : 'Đổi Mật Khẩu'}</button></div></div>)}
          </div>
        </div>
      </div>
    </div>
  )
}
