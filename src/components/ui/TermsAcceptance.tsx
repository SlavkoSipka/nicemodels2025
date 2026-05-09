'use client'

import { useTranslations } from 'next-intl'

interface TermsAcceptanceProps {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  className?: string
}

const linkCls =
  'text-pink-600 hover:text-pink-700 font-semibold underline'

export default function TermsAcceptance({
  checked,
  onChange,
  disabled,
  className,
}: TermsAcceptanceProps) {
  const t = useTranslations('components.termsAcceptance')

  return (
    <label
      className={`flex items-start gap-2 cursor-pointer select-none ${
        disabled ? 'opacity-60 cursor-not-allowed' : ''
      } ${className ?? ''}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-0.5 w-4 h-4 text-pink-600 border-2 border-gray-300 rounded focus:ring-1 focus:ring-pink-200 cursor-pointer"
      />
      <span className="text-xs text-gray-700 leading-snug">
        {t.rich('accept', {
          terms: (chunks) => (
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className={linkCls}
              onClick={(e) => e.stopPropagation()}
            >
              {chunks}
            </a>
          ),
          privacy: (chunks) => (
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className={linkCls}
              onClick={(e) => e.stopPropagation()}
            >
              {chunks}
            </a>
          ),
        })}
      </span>
    </label>
  )
}
