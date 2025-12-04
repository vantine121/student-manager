"use client"
import { createClient } from '@supabase/supabase-js'
import { useState } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Ảnh mặc định nếu không tải ảnh lên
const DEFAULT_IMAGE = "https://cdn-icons-png.flaticon.com/512/4508/4508640.png" // Ảnh hộp quà

export default function AdminShop() {
  const [name, setName] = useState('')
  const [cost, setCost] = useState(0)
  const [stock, setStock] = useState(10)
  const [rarity, setRarity] = useState('COMMON')
  const [category, setCategory] = useState('ITEM') 
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const sanitizeFileName = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-]/g, '')
  }

  const handleCreate = async () => {
    // 1. Bỏ điều kiện !file (Không bắt buộc phải có file)
    if (!name || cost <= 0) return alert("Vui lòng điền tên và giá!")
    
    setUploading(true)
    try {
      let imageUrl = DEFAULT_IMAGE // Mặc định dùng ảnh hộp quà

      // 2. Nếu CÓ chọn file thì mới tải lên
      if (file) {
        const safeName = sanitizeFileName(file.name)
        const fileName = `${Date.now()}-${safeName}`
        const { error: uploadError } = await supabase.storage.from('reward-images').upload(fileName, file)
        if (uploadError) throw uploadError
        imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/reward-images/${fileName}`
      }

      // 3. Lưu vào Database
      const { error: dbError } = await supabase.from('rewards').insert({
        name, cost, stock, rarity, category, image_url: imageUrl
      })

      if (dbError) throw dbError

      alert("🎉 Đã thêm món quà mới thành công!")
      setName(''); setCost(0); setFile(null) // Reset form
    } catch (error: any) {
      alert("Lỗi: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg border-2 border-red-500 shadow-xl max-w-md mx-auto mt-4">
      <h2 className="text-xl font-bold text-red-600 mb-4 uppercase text-center border-b pb-2">🛠️ Nhập Kho Quà Tặng</h2>
      
      <div className="flex flex-col gap-4">
        {/* Chọn Loại Quà */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Loại Quà Tặng</label>
          <div className="flex gap-2 mt-1">
            <button onClick={() => setCategory('ITEM')} className={`flex-1 py-2 rounded text-xs font-bold border ${category === 'ITEM' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>🎁 Đồ Vật</button>
            <button onClick={() => setCategory('FRAME')} className={`flex-1 py-2 rounded text-xs font-bold border ${category === 'FRAME' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>🖼️ Khung</button>
            <button onClick={() => setCategory('COUPON')} className={`flex-1 py-2 rounded text-xs font-bold border ${category === 'COUPON' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>🎫 Phiếu</button>
          </div>
        </div>

        {/* Tên */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Tên vật phẩm</label>
          <input className="w-full border-2 p-2 rounded outline-none focus:border-red-400 transition-colors" type="text" placeholder="Ví dụ: Bút máy cao cấp" value={name} onChange={e => setName(e.target.value)} />
        </div>

        {/* Giá & Kho */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Giá (Xu)</label>
            <input className="w-full border-2 p-2 rounded outline-none focus:border-red-400" type="number" value={cost} onChange={e => setCost(Number(e.target.value))} />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Kho có</label>
            <input className="w-full border-2 p-2 rounded outline-none focus:border-red-400" type="number" value={stock} onChange={e => setStock(Number(e.target.value))} />
          </div>
        </div>

        {/* Độ hiếm */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Độ Hiếm</label>
          <select className="w-full border-2 p-2 rounded outline-none bg-white" value={rarity} onChange={e => setRarity(e.target.value)}>
            <option value="COMMON">⚪ Bình Thường</option>
            <option value="RARE">🔵 Hiếm</option>
            <option value="EPIC">🟣 Siêu Hiếm</option>
            <option value="LEGENDARY">🟡 Huyền Thoại</option>
          </select>
        </div>

        {/* Ảnh (Không bắt buộc) */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
            <span>Hình ảnh mô tả</span>
            <span className="text-gray-400 font-normal italic">(Không bắt buộc)</span>
          </label>
          <label htmlFor="file-upload" className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
            {file ? <span className="font-bold text-green-700 text-sm">{file.name}</span> : (
              <div className="text-center text-gray-400">
                <span className="text-3xl block mb-1">📸</span>
                <span className="text-xs">Bấm để chọn ảnh</span>
              </div>
            )}
            <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
        </div>

        <button onClick={handleCreate} disabled={uploading} className="bg-red-600 text-white font-bold py-3 rounded mt-2 hover:bg-red-700 disabled:bg-gray-400 shadow-lg active:scale-95 transition-transform">
          {uploading ? "⏳ Đang xử lý..." : "💾 LƯU VÀO KHO"}
        </button>
      </div>
    </div>
  )
}