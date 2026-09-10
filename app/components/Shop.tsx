"use client"
import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Shop({ currentUser, onUpdate }: { currentUser: any, onUpdate: () => void }) {
  const [items, setItems] = useState<any[]>([])
  const [processingId, setProcessingId] = useState<number | null>(null)

  // Lấy số dư và phiếu từ currentUser (đảm bảo luôn mới nhất từ trang mẹ)
  const myCoins = currentUser?.wallet_coins || 0
  const myCoupons = currentUser?.coupon_count || 0
  const myFrames = currentUser?.owned_frames || []

  useEffect(() => {
    const fetchRewards = async () => {
      const { data } = await supabase.from('rewards').select('*').gt('stock', 0).order('cost', { ascending: false })
      if (data) setItems(data)
    }
    fetchRewards()
  }, [])

  const calculatePrice = (originalPrice: number, category: string) => {
    // Không giảm giá khi mua chính cái Phiếu đó
    if (category === 'COUPON_VIP') return originalPrice
    // Nếu có phiếu -> Giảm 5%
    if (myCoupons > 0) return Math.floor(originalPrice * 0.95)
    return originalPrice
  }

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY': return 'border-yellow-500 bg-yellow-50 shadow-yellow-200 shadow-lg'
      case 'EPIC': return 'border-purple-500 bg-purple-50 shadow-purple-200'
      case 'RARE': return 'border-blue-500 bg-blue-50'
      default: return 'border-gray-200 bg-white'
    }
  }

  const handleBuy = async (item: any) => {
    if (!currentUser) return alert("Vui lòng đăng nhập!")
    if (processingId) return // Chặn click liên tục

    // 1. Kiểm tra sở hữu Khung (Tránh mua trùng)
    const frameIdentifier = item.category === 'FRAME' ? item.image_url : item.category.replace('FRAME_', '')
    // Kiểm tra kỹ hơn: Nếu item là Frame và frameIdentifier đã có trong mảng myFrames
    const isFrame = item.category.includes('FRAME')
    if (isFrame && myFrames.includes(frameIdentifier)) {
      return alert("Bạn đã có khung này rồi! Vào 'Trang Cá Nhân' để đeo nhé.")
    }

    // 2. Tính toán tiền
    const finalPrice = calculatePrice(item.cost, item.category)
    const isUsingCoupon = myCoupons > 0 && item.category !== 'COUPON_VIP'

    if (myCoins < finalPrice) return alert(`Bạn thiếu ${finalPrice - myCoins} xu!`)
    
    const confirmMsg = isUsingCoupon 
      ? `Dùng 1 PHIẾU GIẢM GIÁ để mua "${item.name}" với giá ${finalPrice} Xu?`
      : `Mua "${item.name}" với giá ${finalPrice} Xu?`

    if (!confirm(confirmMsg)) return

    setProcessingId(item.id)

    try {
      // 3. CHUẨN BỊ DỮ LIỆU CẬP NHẬT (UPDATE PAYLOAD)
      let updateData: any = { 
        wallet_coins: myCoins - finalPrice // <-- TRỪ TIỀN TẠI ĐÂY
      }

      // Xử lý Phiếu giảm giá
      if (item.category === 'COUPON_VIP') {
          updateData.coupon_count = myCoupons + 1
      } else if (isUsingCoupon) {
          updateData.coupon_count = Math.max(0, myCoupons - 1)
      }

      // Xử lý Khung (Nếu mua khung)
      if (isFrame) {
        // Tạo danh sách khung mới an toàn (lọc null/undefined)
        const safeCurrentFrames = Array.isArray(myFrames) ? myFrames : []
        const newFrames = [...safeCurrentFrames, frameIdentifier]
        
        updateData.owned_frames = newFrames
        
        // Tự động đeo luôn khung mới mua
        if (item.category === 'FRAME') {
          updateData.frame_url = item.image_url
          updateData.frame_type = 'CUSTOM'
        } else {
          updateData.frame_type = frameIdentifier
          updateData.frame_url = null
        }
      }

      // 4. GỬI LỆNH CẬP NHẬT PROFILE
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', currentUser.id)

      if (updateError) throw updateError

      // 5. TRỪ KHO (Chỉ trừ đồ vật, khung thì thôi)
      if (item.stock < 900) {
          await supabase.from('rewards').update({ stock: item.stock - 1 }).eq('id', item.id)
      }
      
      // 6. GHI LỊCH SỬ
      await supabase.from('redemptions').insert({ 
        student_id: currentUser.id, 
        reward_id: item.id,
        cost_at_time: finalPrice,
        status: isFrame || item.category === 'COUPON_VIP' ? 'DELIVERED' : 'PENDING'
      })

      // 7. THÔNG BÁO & CẬP NHẬT GIAO DIỆN
      alert("🎉 Mua thành công! Tiền đã trừ, hàng đã nhận.")
      if (onUpdate) onUpdate() // Gọi trang mẹ load lại dữ liệu mới ngay lập tức

    } catch (error: any) {
      alert("Lỗi giao dịch: " + error.message)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="p-4 animate-fade-in">
      {/* Banner VIP */}
      {myCoupons > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-xl mb-6 text-center font-bold shadow-lg flex items-center justify-center gap-2">
          <span>🎟️</span> Bạn có {myCoupons} phiếu giảm giá 5% (Tự động dùng khi mua đồ)
        </div>
      )}

      {/* Header Shop */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl border border-yellow-200 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
           <span className="text-2xl">🎁</span>
           <h2 className="text-xl font-black text-gray-800 uppercase">Shop Quà</h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 font-bold uppercase">Số dư của bạn</p>
          <p className="text-2xl font-black text-yellow-500">{myCoins} 💰</p>
        </div>
      </div>

      {/* Danh sách hàng */}
      {/* Mobile: grid-cols-2, Gap nhỏ (gap-2). PC: grid-cols-5, Gap lớn (gap-4) */}
<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
        {items.map((item) => {
          const finalPrice = calculatePrice(item.cost, item.category)
          const isDiscounted = myCoupons > 0 && item.category !== 'COUPON_VIP'
          
          // Check sở hữu khung
          const frameIdentifier = item.category === 'FRAME' ? item.image_url : item.category.replace('FRAME_', '')
          const isOwned = item.category.includes('FRAME') && myFrames.includes(frameIdentifier)

          return (
            <div key={item.id} className={`border rounded-xl p-3 flex flex-col gap-2 relative bg-white hover:shadow-lg transition-all ${getRarityStyle(item.rarity)}`}>
              
              {isDiscounted && <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-bounce z-10">-5%</span>}

              <div className="h-28 w-full bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden p-2">
                 {item.image_url ? <img src={item.image_url} className="h-full w-full object-contain" referrerPolicy="no-referrer" /> : <span className="text-4xl">🎁</span>}
              </div>
              
              <div className="flex-1 text-center">
                <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 min-h-[2.5em] flex items-center justify-center">{item.name}</h3>
                <div className="mt-2 flex flex-col items-center">
                  {isOwned ? (
                    <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Đã sở hữu</span>
                  ) : (
                    <>
                      {isDiscounted && <span className="text-xs text-gray-400 line-through">{item.cost}</span>}
                      <span className={`font-black text-lg ${isDiscounted ? 'text-red-600' : 'text-yellow-600'}`}>{finalPrice} 💰</span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Kho: {item.stock}</p>
              </div>

              <button 
                disabled={item.stock <= 0 || isOwned || processingId !== null}
                onClick={() => handleBuy(item)}
                className={`w-full font-bold py-2 rounded-lg text-xs text-white shadow-md active:scale-95 transition-transform
                  ${isOwned ? 'bg-gray-300 cursor-not-allowed' : 
                    item.stock <= 0 ? 'bg-gray-300 cursor-not-allowed' :
                    item.category.includes('FRAME') ? 'bg-purple-600 hover:bg-purple-700' : 
                    item.category.includes('COUPON') ? 'bg-green-600 hover:bg-green-700' : 
                    'bg-yellow-500 hover:bg-yellow-600'}`}
              >
                {processingId === item.id ? '⏳...' : isOwned ? 'Đã Có' : item.stock <= 0 ? 'Hết Hàng' : 'MUA NGAY'}
              </button>
            </div>
          )
        })}
      </div>
      
      {items.length === 0 && <div className="text-center p-10 text-gray-400">Shop đang nhập hàng...</div>}
    </div>
  )
}
