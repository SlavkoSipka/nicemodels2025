import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function EscortLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fce9f3' }}>
      <Navbar />
      {children}
      <Footer />
    </div>
  )
}
