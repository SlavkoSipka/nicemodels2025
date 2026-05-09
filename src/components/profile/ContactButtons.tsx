'use client'

import { useState } from 'react'
import { Phone, MessageCircle, Send, Eye } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ContactDetails {
  phone_number?: string | null
  country_code?: string | null
  show_phone_number?: boolean
  has_whatsapp?: boolean
  has_viber?: boolean
  has_telegram?: boolean
  contact_instruction?: string | null
  other_instructions?: string | null
  no_withheld_numbers?: boolean
}

interface ContactButtonsProps {
  contactDetails: ContactDetails | null
  profileId: string
}

export default function ContactButtons({ contactDetails, profileId }: ContactButtonsProps) {
  const [revealed, setRevealed] = useState(false)
  const t = useTranslations('components.profile.contactButtons')

  const hasPhone = !!(contactDetails?.phone_number?.trim())
  const autoVisible = contactDetails?.show_phone_number === true
  const fullNumber = hasPhone
    ? `${contactDetails?.country_code || ''}${contactDetails?.phone_number}`.trim()
    : null

  const handleCall = () => {
    if (fullNumber) window.location.href = `tel:${fullNumber}`
  }

  const handleWhatsApp = () => {
    if (fullNumber) {
      const clean = fullNumber.replace(/[\s\-\(\)]/g, '')
      window.open(`https://wa.me/${clean.startsWith('+') ? clean.slice(1) : clean}`, '_blank')
    }
  }

  const handleViber = () => {
    if (fullNumber) {
      const clean = fullNumber.replace(/[\s\-\(\)]/g, '')
      window.open(`viber://chat?number=${encodeURIComponent(clean)}`, '_blank')
    }
  }

  const handleTelegram = () => {
    if (fullNumber) {
      const clean = fullNumber.replace(/[\s\-\(\)]/g, '')
      window.open(`https://t.me/${clean}`, '_blank')
    }
  }

  return (
    <div className="space-y-3">
      {/* Show Contact / Phone reveal */}
      {hasPhone ? (
        <div>
          {autoVisible || revealed ? (
            <a
              href={`tel:${fullNumber}`}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(90deg, #ec4899, #f472b6)', boxShadow: 'rgba(236,72,153,0.2) 0px 2px 10px' }}
            >
              <Phone className="w-5 h-5" />
              {fullNumber}
            </a>
          ) : (
            <button
              onClick={() => setRevealed(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(90deg, #ec4899, #f472b6)', boxShadow: 'rgba(236,72,153,0.2) 0px 2px 10px' }}
            >
              <Eye className="w-5 h-5" />
              {t('showContact')}
            </button>
          )}
        </div>
      ) : (
        <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-gray-100 text-gray-400 cursor-not-allowed select-none">
          <Phone className="w-5 h-5" />
          {t('noPhone')}
        </div>
      )}

      {/* Messenger buttons — only shown when phone revealed or always visible */}
      {hasPhone && (contactDetails?.has_whatsapp || contactDetails?.has_viber || contactDetails?.has_telegram) && (
        <div className="flex gap-2">
          {contactDetails?.has_whatsapp && (
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all bg-[#25D366] hover:bg-[#1ebe5d]"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
          )}
          {contactDetails?.has_viber && (
            <button
              onClick={handleViber}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all bg-[#7360f2] hover:bg-[#5b4cd4]"
            >
              <MessageCircle className="w-4 h-4" />
              Viber
            </button>
          )}
          {contactDetails?.has_telegram && (
            <button
              onClick={handleTelegram}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all bg-[#2AABEE] hover:bg-[#1a98d9]"
            >
              <Send className="w-4 h-4" />
              Telegram
            </button>
          )}
        </div>
      )}

      {/* Instructions */}
      {(autoVisible || revealed) && (contactDetails?.contact_instruction || contactDetails?.other_instructions) && (
        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 space-y-1">
          {contactDetails?.contact_instruction && (
            <p className="capitalize">{contactDetails.contact_instruction.replace(/_/g, ' ')}</p>
          )}
          {contactDetails?.other_instructions && (
            <p className="italic text-gray-500">{contactDetails.other_instructions}</p>
          )}
        </div>
      )}

      {(autoVisible || revealed) && contactDetails?.no_withheld_numbers && (
        <p className="text-xs text-gray-400 text-center">{t('noWithheld')}</p>
      )}
    </div>
  )
}
