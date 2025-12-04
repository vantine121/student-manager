"use client"
import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Shop({ currentUser, onUpdate }: { currentUser: any, onUpdate: () => void }) {
  const [items, setItems] = useState<any[]>([])
  const [myCoins, setMyCoins] = useState(currentUser?.wallet_coins || 0)
  const [myCoupons, setMyCoupons] = useState(currentUser?.coupon_count || 0)
  // Lấy danh sách khung đã có để không cho mua trùng
  const myFrames = currentUser?.owned_frames || []

  const fetchRewards = async () => {
    const { data } = await supabase.from('rewards').select('*').order('cost', { ascending: false })
    if (data) setItems(data)
  }

  useEffect(() => { fetchRewards() }, [])

  useEffect(() => {
    setMyCoins(currentUser?.wallet_coins || 0)
    setMyCoupons(currentUser?.coupon_count || 0)
  }, [currentUser])

  const calculatePrice = (originalPrice: number, category: string) => {
    if (category === 'COUPON_VIP') return originalPrice
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
    if (!currentUser) return alert("Chưa chọn người mua!")
    
    // Kiểm tra nếu đã có khung này rồi thì không cho mua nữa (tránh phí tiền)
    let frameCode = ''
    if (item.category === 'FRAME_GOLD') frameCode = 'GOLD'
    if (item.category === 'FRAME_SILVER') frameCode = 'SILVER'
    if (item.category === 'FRAME_BRONZE') frameCode = 'BRONZE'

    if (frameCode && myFrames.includes(frameCode)) {
      return alert("Bạn đã sở hữu khung này rồi! Vào 'Trang Cá Nhân' để đeo nhé.")
    }

    const finalPrice = calculatePrice(item.cost, item.category)
    const isUsingCoupon = myCoupons > 0 && item.category !== 'COUPON_VIP'

    if (myCoins < finalPrice) return alert("Không đủ tiền!")
    
    const confirmMsg = isUsingCoupon 
      ? `Dùng 1 PHIẾU GIẢM GIÁ để mua "${item.name}" với giá ${finalPrice} Xu?`
      : `Mua "${item.name}" với giá ${finalPrice} Xu?`

    if (!confirm(confirmMsg)) return

    let updateData: any = { wallet_coins: myCoins - finalPrice }
    let newCouponCount = myCoupons

    if (item.category === 'COUPON_VIP') {
        newCouponCount = myCoupons + 1
        updateData.coupon_count = newCouponCount
    } else if (isUsingCoupon) {
        newCouponCount = myCoupons - 1
        updateData.coupon_count = newCouponCount
    }

    // --- LOGIC MỚI: MUA KHUNG ---
    if (frameCode) {
      // Thêm khung mới vào mảng đã sở hữu
      const newFrames = [...myFrames, frameCode]
      updateData.owned_frames = newFrames
      updateData.frame_type = frameCode // Tự động đeo luôn cái mới mua
    }

    await supabase.from('profiles').update(updateData).eq('id', currentUser.id)
    
    if (item.stock < 900) {
        await supabase.from('rewards').update({ stock: item.stock - 1 }).eq('id', item.id)
    }
    
    await supabase.from('redemptions').insert({ 
      student_id: currentUser.id, 
      reward_id: item.id,
      cost_at_time: finalPrice,
      status: item.category.includes('FRAME') || item.category === 'COUPON_VIP' ? 'DELIVERED' : 'PENDING'
    })

    setMyCoins(myCoins - finalPrice) 
    setMyCoupons(newCouponCount)
    fetchRewards() 
    if (onUpdate) onUpdate()

    alert("🎉 Mua thành công! Vào Trang Cá Nhân để xem kho đồ.")
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
        <div className="flex items-center gap-2">
            <span className="text-2xl">🎫</span>
            <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Kho Voucher</p>
                <p className="font-bold text-blue-900">{myCoupons} phiếu giảm giá</p>
            </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500 font-bold uppercase">Số dư</p>
          <p className="text-2xl font-black text-yellow-500">{myCoins} 💰</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => {
          const finalPrice = calculatePrice(item.cost, item.category)
          const isDiscounted = myCoupons > 0 && item.category !== 'COUPON_VIP'
          
          // Kiểm tra xem đã sở hữu khung chưa
          let isOwned = false
          if (item.category === 'FRAME_GOLD' && myFrames.includes('GOLD')) isOwned = true
          if (item.category === 'FRAME_SILVER' && myFrames.includes('SILVER')) isOwned = true
          if (item.category === 'FRAME_BRONZE' && myFrames.includes('BRONZE')) isOwned = true

          return (
            <div key={item.id} className={`border rounded-xl p-3 flex flex-col gap-2 relative bg-white hover:shadow-lg transition-all ${getRarityStyle(item.rarity)}`}>
              
              {isDiscounted && <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-bounce">-5%</span>}

              <div className="h-24 flex items-center justify-center bg-gray-50 rounded-lg">
                 {item.image_url ? <img src={item.image_url} className="h-16 object-contain" referrerPolicy="no-referrer" /> : <span className="text-4xl">🎁</span>}
              </div>
              
              <div className="flex-1 text-center">
                <h3 className="font-bold text-gray-900 text-sm leading-tight">{item.name}</h3>
                <div className="mt-2">
                  {isOwned ? (
                    <span className="text-sm font-bold text-green-600">Đã sở hữu</span>
                  ) : (
                    <>
                      {isDiscounted && <span className="text-xs text-gray-400 line-through block">{item.cost}</span>}
                      <span className={`font-black text-lg ${isDiscounted ? 'text-red-600' : 'text-yellow-600'}`}>{finalPrice} 💰</span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Kho: {item.stock}</p>
              </div>

              <button 
                disabled={item.stock <= 0 || isOwned}
                onClick={() => handleBuy(item)}
                className={`w-full font-bold py-2 rounded text-xs text-white shadow-md active:scale-95 transition-transform
                  ${isOwned ? 'bg-gray-400 cursor-not-allowed' : 
                    item.category.includes('FRAME') ? 'bg-purple-600 hover:bg-purple-700' : 
                    item.category.includes('COUPON') ? 'bg-green-600 hover:bg-green-700' : 
                    'bg-yellow-500 hover:bg-yellow-600'}`}
              >
                {isOwned ? 'ĐÃ MUA' : item.category.includes('FRAME') ? 'MUA KHUNG' : item.category.includes('COUPON') ? 'MUA PHIẾU' : 'ĐỔI QUÀ'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}