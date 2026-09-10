"use client"
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Danh sách 12 mã avatar mẫu
const AVATAR_LIST = [
  'robot01', 'robot02', 'robot03', 'robot04',
  'monster01', 'monster02', 'monster03', 'monster04',
  'cat01', 'cat02', 'cat03', 'cat04'
]

export default function AvatarSelectionModal({ currentUser, onClose, onUpdate }: { currentUser: any, onClose: () => void, onUpdate: () => void }) {
  const [selectedCode, setSelectedCode] = useState(currentUser.avatar_code || AVATAR_LIST[0])
  const [saving, setSaving] = useState(false)

  // Hàm lấy link ảnh đầy đủ từ mã
  const getAvatarUrl = (code: string) => {
    // Dùng bộ ảnh 1 (Robots) cho mã robot, bộ 2 (Monsters) cho mã monster, bộ 4 (Cats) cho mã cat
    let set = 'set1';
    if (code.startsWith('monster')) set = 'set2';
    if (code.startsWith('cat')) set = 'set4';
    return `https://robohash.org/${code}.png?set=${set}&size=150x150`
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_code: selectedCode })
      .eq('id', currentUser.id)

    setSaving(false)
    if (error) {
      alert("Lỗi lưu avatar: " + error.message)
    } else {
      onUpdate() // Cập nhật giao diện trang mẹ
      onClose() // Đóng modal
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">🎭 Chọn Ảnh Đại Diện</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        {/* Body: Lưới ảnh */}
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {AVATAR_LIST.map(code => (
              <div key={code} 
                   onClick={() => setSelectedCode(code)}
                   className={`aspect-square rounded-xl border-4 overflow-hidden cursor-pointer transition-all hover:scale-105 relative
                     ${selectedCode === code ? 'border-blue-500 shadow-lg shadow-blue-200 bg-blue-50 scale-105' : 'border-gray-200 hover:border-blue-300 bg-gray-50'}`}>
                <img src={getAvatarUrl(code)} alt={code} className="w-full h-full object-cover" />
                {selectedCode === code && (
                  <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">✓</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer: Nút Lưu */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors">Hủy</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95 flex items-center gap-2 disabled:opacity-70">
            {saving ? '⏳ Đang lưu...' : '💾 Lưu Thay Đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}
