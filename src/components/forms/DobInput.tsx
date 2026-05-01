'use client'

import { useEffect, useState } from 'react'
import { autoFormatDob, formatDobDisplay, parseDobInput } from '@/lib/utils/dob'

interface Props {
  /** ISO value (YYYY-MM-DD) or empty string. */
  value: string
  /** Receives ISO (YYYY-MM-DD) when input is a valid date, otherwise ''. */
  onChange: (iso: string) => void
  className?: string
  required?: boolean
  disabled?: boolean
  id?: string
  name?: string
  /** Forces user not to be able to enter a future birth date. */
  maxYearsAgo?: number
  /** Forces user to be at least N years old. */
  minYearsAgo?: number
  placeholder?: string
}

/**
 * Date-of-birth input without a calendar. Format: DD.MM.YYYY.
 * Stores value in ISO (YYYY-MM-DD) for the parent.
 */
export default function DobInput({
  value,
  onChange,
  className,
  required,
  disabled,
  id,
  name,
  minYearsAgo,
  maxYearsAgo,
  placeholder = 'DD.MM.YYYY',
}: Props) {
  // Display state (DD.MM.YYYY). Stays in sync with `value` (ISO).
  const [display, setDisplay] = useState<string>(formatDobDisplay(value))

  useEffect(() => {
    setDisplay(formatDobDisplay(value))
  }, [value])

  const handleChange = (raw: string) => {
    const formatted = autoFormatDob(raw)
    setDisplay(formatted)
    const iso = parseDobInput(formatted)
    if (iso) {
      // Optional age bounds
      const year = Number(iso.slice(0, 4))
      const now = new Date().getFullYear()
      if (typeof minYearsAgo === 'number' && now - year < minYearsAgo) {
        onChange('')
        return
      }
      if (typeof maxYearsAgo === 'number' && now - year > maxYearsAgo) {
        onChange('')
        return
      }
      onChange(iso)
    } else {
      onChange('')
    }
  }

  return (
    <input
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      autoComplete="bday"
      value={display}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      maxLength={10}
      pattern="\d{2}\.\d{2}\.\d{4}"
      required={required}
      disabled={disabled}
      className={className}
    />
  )
}
