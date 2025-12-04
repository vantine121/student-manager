import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Bắt buộc phải có dòng này để hiện màu

const inter = Inter({ subsets: ["latin"] });

// --- CẤU HÌNH THẺ CHIA SẺ LINK (ZALO/FACEBOOK) ---
export const metadata: Metadata = {
  title: "Sổ Thi Đua Điện Tử - THCS Đằng Lâm",
  description: "Hệ thống quản lý thi đua, đổi quà và xếp hạng học sinh.",
  openGraph: {
    title: "Sổ Thi Đua Điện Tử - THCS Đằng Lâm",
    description: "Tham gia đua top, tích xu và đổi quà ngay!",
    // Ảnh này sẽ hiện ra khi gửi link (Lấy từ thư mục public)
    images: ["/logo-truong.jpg"], 
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className}>{children}</body>
    </html>
  );
}