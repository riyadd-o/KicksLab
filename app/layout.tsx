import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import WishlistDrawer from "@/components/cart/WishlistDrawer";
import BlackFridayBanner from "@/components/layout/BlackFridayBanner";
import MainWrapper from "@/components/layout/MainWrapper";
import AuthProvider from "@/components/auth/AuthProvider";
import CartAuthSync from "@/components/cart/CartAuthSync";
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KicksLab | Premium Footwear",
  description: "Premium footwear for every stride.",
  keywords: ["shoes", "luxury shoes", "premium footwear", "cognac leather shoes", "sneakers", "boots", "loafers", "sandals", "heels"],
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0D0D0D] text-[#F5F0E8] selection:bg-[#C9A96E] selection:text-[#0D0D0D]">
        <AuthProvider>
          <CartAuthSync />
          <div className="relative flex-1 flex flex-col">
            <Navbar />
            <MainWrapper>
              {children}
            </MainWrapper>
          </div>
          <Footer />
            <CartDrawer />
            <WishlistDrawer />
          </AuthProvider>
      </body>
    </html>
  );
}
