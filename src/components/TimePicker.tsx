import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'

interface WheelColumnProps {
  values: string[]
  selected: number
  onChange: (i: number) => void
  dimSelected?: boolean
  onUserInteract?: () => void
}

const ITEM_H = 64

function WheelColumn({ values, selected, onChange, dimSelected, onUserInteract }: WheelColumnProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [displayIdx, setDisplayIdx] = useState(selected)
  const prevSelected = useRef(-1)
  const onChangeFn = useRef(onChange)
  onChangeFn.current = onChange
  const onUserInteractFn = useRef(onUserInteract)
  onUserInteractFn.current = onUserInteract

  // touchstart and wheel only fire from real user input, never from scrollTo()
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handler = () => onUserInteractFn.current?.()
    el.addEventListener('touchstart', handler, { passive: true })
    el.addEventListener('wheel', handler, { passive: true })
    return () => {
      el.removeEventListener('touchstart', handler)
      el.removeEventListener('wheel', handler)
    }
  }, [])

  // Sync scroll position when selected changes externally
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (prevSelected.current === -1) {
      el.scrollTop = selected * ITEM_H
    } else if (prevSelected.current !== selected) {
      el.scrollTo({ top: selected * ITEM_H, behavior: 'smooth' })
      setDisplayIdx(selected)
    }
    prevSelected.current = selected
  }, [selected])

  // Commit value to parent on scroll end
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handler = () => {
      const idx = Math.max(0, Math.min(values.length - 1, Math.round(el.scrollTop / ITEM_H)))
      onChangeFn.current(idx)
    }
    el.addEventListener('scrollend', handler)
    return () => el.removeEventListener('scrollend', handler)
  }, [values.length])

  const handleScroll = useCallback(() => {
    const el = ref.current
    if (!el) return
    const idx = Math.max(0, Math.min(values.length - 1, Math.round(el.scrollTop / ITEM_H)))
    setDisplayIdx(idx)
  }, [values.length])

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="no-scrollbar"
      style={{
        width: 88,
        height: ITEM_H * 3,
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        scrollbarWidth: 'none',
        position: 'relative',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div style={{ height: ITEM_H, scrollSnapAlign: 'none', flexShrink: 0 }} />
      {values.map((v, i) => {
        const dist = Math.abs(i - displayIdx)
        const isSel = dist === 0
        const isAdj = dist === 1
        return (
          <div
            key={i}
            style={{
              height: ITEM_H,
              scrollSnapAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isSel ? (dimSelected ? 'rgba(255,255,255,0.4)' : '#C6F135') : isAdj ? '#4A4A4A' : '#1E1E1E',
              fontSize: isSel ? 52 : isAdj ? 22 : 14,
              fontWeight: isSel ? 700 : 400,
              fontFamily: "'Lexend', sans-serif",
              lineHeight: 1,
              userSelect: 'none',
              transition: 'color 0.12s, font-size 0.12s',
            }}
          >
            {v}
          </div>
        )
      })}
      <div style={{ height: ITEM_H, scrollSnapAlign: 'none', flexShrink: 0 }} />
    </div>
  )
}

// Generate array of zero-padded values from 0 to max-1
function makeValues(max: number) {
  return Array.from({ length: max }, (_, i) => String(i).padStart(2, '0'))
}

const HOURS = makeValues(100)
const MINUTES = makeValues(60)
const SECONDS = makeValues(60)

function parseQuickInput(digits: string, isPace: boolean): number[] {
  if (isPace) {
    const padded = digits.padStart(4, '0').slice(-4)
    const m = parseInt(padded.slice(0, 2)) || 0
    const s = parseInt(padded.slice(2, 4)) || 0
    return [Math.min(m, 99), Math.min(s, 59)]
  } else {
    const padded = digits.padStart(6, '0').slice(-6)
    const h = parseInt(padded.slice(0, 2)) || 0
    const m = parseInt(padded.slice(2, 4)) || 0
    const s = parseInt(padded.slice(4, 6)) || 0
    return [Math.min(h, 99), Math.min(m, 59), Math.min(s, 59)]
  }
}

interface TimePickerProps {
  field: 'time' | 'pace'
  initialSeconds: number
  onSave: (seconds: number) => void
  onCancel: () => void
  title?: string
  subtitle?: string
  cancelLabel?: string
}

export default function TimePicker({ field, initialSeconds, onSave, onCancel, title, subtitle, cancelLabel }: TimePickerProps) {
  const isPace = field === 'pace'
  const initH = Math.floor(initialSeconds / 3600)
  const initM = Math.floor((initialSeconds % 3600) / 60)
  const initS = Math.floor(initialSeconds % 60)

  const [h, setH] = useState(Math.min(initH, 99))
  const [m, setM] = useState(initM)
  const [s, setS] = useState(initS)
  const [quickInput, setQuickInput] = useState('')
  const [quickFocused, setQuickFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUserScroll = useCallback(() => {
    if (quickInput) {
      setQuickInput('')
      inputRef.current?.blur()
    }
  }, [quickInput])

  const handleQuickChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, isPace ? 4 : 6)
    setQuickInput(digits)
    if (digits.length > 0) {
      const parts = parseQuickInput(digits, isPace)
      if (isPace) {
        setM(parts[0]); setS(parts[1])
      } else {
        setH(parts[0]); setM(parts[1]); setS(parts[2])
      }
    }
  }

  const totalSeconds = isPace ? m * 60 + s : h * 3600 + m * 60 + s

  // Detect if the raw seconds digits from quick input were clamped
  const isSecsClamped = quickInput.length >= 2
    ? parseInt(quickInput.slice(-2)) > 59
    : false

  const columns = isPace
    ? [{ values: MINUTES, value: m, onChange: setM, dimSelected: false }, { values: SECONDS, value: s, onChange: setS, dimSelected: isSecsClamped }]
    : [
        { values: HOURS, value: h, onChange: setH, dimSelected: false },
        { values: MINUTES, value: m, onChange: setM, dimSelected: false },
        { values: SECONDS, value: s, onChange: setS, dimSelected: isSecsClamped },
      ]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Scrim */}
      <div
        style={{ flex: 1, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
        onClick={() => onSave(totalSeconds)}
      />

      {/* Bottom sheet */}
      <div
        style={{
          background: '#1A1A1A',
          borderRadius: '20px 20px 0 0',
          paddingBottom: 40,
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 40, height: 4, background: '#3A3A3A', borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
          }}
        >
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontFamily: "'Lexend', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: 1,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {cancelLabel ?? 'CANCEL'}
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span
              style={{
                fontFamily: "'Lexend', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: 'white',
              }}
            >
              {title ?? (isPace ? 'Pace Picker' : 'Time Picker')}
            </span>
            {subtitle && (
              <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 11, color: '#888', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {subtitle}
              </span>
            )}
          </div>
          <button
            onClick={() => onSave(totalSeconds)}
            style={{
              background: 'none',
              border: 'none',
              color: '#C6F135',
              fontFamily: "'Lexend', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 1,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            SAVE
          </button>
        </div>

        {/* Wheel area */}
        <div style={{ position: 'relative', margin: '8px 0' }}>
          {/* Center selection highlight */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: ITEM_H,
              height: ITEM_H,
              borderTop: '1px solid #2E2E2E',
              borderBottom: '1px solid #2E2E2E',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
          {/* Fade overlays */}
          <div
            style={{
              position: 'absolute',
              left: 0, right: 0, top: 0, height: ITEM_H,
              background: 'linear-gradient(to bottom, #1A1A1A, transparent)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0, right: 0, bottom: 0, height: ITEM_H,
              background: 'linear-gradient(to top, #1A1A1A, transparent)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />

          {/* Columns */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0,
            }}
          >
            {columns.map((col, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <WheelColumn
                  values={col.values}
                  selected={col.value}
                  onChange={col.onChange}
                  dimSelected={col.dimSelected}
                  onUserInteract={handleUserScroll}
                />
                {i < columns.length - 1 && (
                  <div
                    style={{
                      width: 24,
                      textAlign: 'center',
                      fontFamily: "'Lexend', sans-serif",
                      fontWeight: 700,
                      fontSize: 32,
                      color: '#4A4A4A',
                      userSelect: 'none',
                      pointerEvents: 'none',
                      paddingBottom: 2,
                    }}
                  >
                    :
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Input */}
        <div style={{ padding: '16px 24px 0' }}>
          <div
            style={{
              fontFamily: "'Lexend', sans-serif",
              fontWeight: 400,
              fontSize: 10,
              color: '#C4C9AC',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            {isPace ? 'QUICK INPUT (E.G., 259)' : `QUICK INPUT (E.G., 20814)`}
          </div>
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              value={quickInput}
              onChange={e => handleQuickChange(e.target.value)}
              onFocus={() => setQuickFocused(true)}
              onBlur={() => setQuickFocused(false)}
              placeholder={isPace ? 'Enter pace manually (e.g., 259)' : 'Enter time manually (e.g., 20814)'}
              inputMode="numeric"
              autoFocus={false}
              style={{
                width: '100%',
                background: quickFocused ? '#1A1E00' : '#252525',
                border: 'none',
                borderBottom: quickFocused ? '2px solid #C3F400' : '2px solid transparent',
                borderRadius: '4px 4px 0 0',
                padding: '14px 40px 14px 14px',
                color: quickInput ? 'white' : '#666',
                fontFamily: "'Lexend', sans-serif",
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'background 0.15s, border-color 0.15s',
              }}
            />
            {quickFocused && quickInput && (
              <button
                onMouseDown={e => { e.preventDefault(); setQuickInput('') }}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" fill="#444"/>
                  <path d="M7 7l6 6M13 7l-6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
