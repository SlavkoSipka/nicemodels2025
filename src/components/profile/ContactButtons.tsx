'use client'

import { Phone, MessageSquare, Calendar } from 'lucide-react'

interface ContactButtonsProps {
  phone: string
  profileId: string
}

export default function ContactButtons({ phone, profileId }: ContactButtonsProps) {
  const handleCall = () => {
    window.location.href = `tel:${phone}`
  }

  const handleWhatsApp = () => {
    const cleanPhone = phone.replace(/\s+/g, '')
    window.open(`https://wa.me/${cleanPhone}`, '_blank')
  }

  const handleMessage = () => {
    // Navigate to messages page
    window.location.href = `/messages/${profileId}`
  }

  const handleBooking = () => {
    // Navigate to booking page
    window.location.href = `/booking/${profileId}`
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleCall}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition flex items-center justify-center"
      >
        <Phone className="w-5 h-5 mr-2" />
        Call Now
      </button>

      <button
        onClick={handleWhatsApp}
        className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition flex items-center justify-center"
      >
        <MessageSquare className="w-5 h-5 mr-2" />
        WhatsApp
      </button>

      <button
        onClick={handleMessage}
        className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition flex items-center justify-center"
      >
        <MessageSquare className="w-5 h-5 mr-2" />
        Send Message
      </button>

      <button
        onClick={handleBooking}
        className="w-full border-2 border-pink-500 text-pink-500 py-3 rounded-lg font-semibold hover:bg-pink-50 transition flex items-center justify-center"
      >
        <Calendar className="w-5 h-5 mr-2" />
        Book Appointment
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        {phone}
      </p>
    </div>
  )
}

