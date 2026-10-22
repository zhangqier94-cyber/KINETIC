import { useState, useEffect, useRef } from 'react'
import TimePicker from './components/TimePicker'
import PacePlanning from './pages/PacePlanning'
import RunningShoes from './pages/RunningShoes'
import { ShareCardModal, type ShareData } from './components/ShareCard'

const assetPathPrefix = '/assets'
const imgLightning = `${assetPathPrefix}/8a0b4.svg`
const imgShare = `${assetPathPrefix}/30fee.svg`
const imgReset = `${assetPathPrefix}/aa39f.svg`
const imgFlag = `${assetPathPrefix}/05a2b.svg`
const imgCircleX = `${assetPathPrefix}/b10a4.svg`
const imgCalculator = `${assetPathPrefix}/a45ba.svg`
const imgLogo = `${assetPathPrefix}/2f17b.svg`
const imgSettings = `${assetPathPrefix}/76649.svg`
const imgStatusIcons = `${assetPathPrefix}/76cef.svg`
const imgClearX = `${assetPathPrefix}/5f369.svg`

const STATUS_BAR_H = 50
const HEADER_H = 72
const FIXED_TOP_H = STATUS_BAR_H + HEADER_H

function useTime() {
  const [time, setTime] = useState(() => {
    const now = new Date()
    return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
  })
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date()
      setTime(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`)
    }, 10000)
    return () => clearInterval(id)
  }, [])
  return time
}

const PRESETS = [
  { label: 'FULL', km: 42.195 },
  { label: 'HALF', km: 21.0975 },
  { label: '10KM', km: 10 },
  { label: '5KM', km: 5 },
  { label: '1Mi', km: 1.60934 },
  { label: '1KM', km: 1 },
  { label: '800M', km: 0.8 },
  { label: '400M', km: 0.4 },
]

function formatHMS(totalSecs: number) {
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = Math.floor(totalSecs % 60)
  return `${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`
}

function formatMS(totalSecs: number) {
  const m = Math.floor(totalSecs / 60)
  const s = Math.floor(totalSecs % 60)
  return `${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`
}

type PickerField = 'time' | 'pace'

export default function App() {
  const [page, setPage] = useState<'home' | 'pace-planning' | 'running-shoes'>('home')

  if (page === 'pace-planning') {
    return <PacePlanning onBack={() => setPage('home')} />
  }

  if (page === 'running-shoes') {
    return <RunningShoes onBack={() => setPage('home')} />
  }

  return <Home onNavigate={setPage} />
}

function Home({
  onNavigate,
}: {
  onNavigate: (page: 'pace-planning' | 'running-shoes') => void
}) {
  const currentTime = useTime()
  const [distanceStr, setDistanceStr] = useState('')
  const [distanceFocused, setDistanceFocused] = useState(false)
  const [timeSeconds, setTimeSeconds] = useState<number | null>(null)
  const [paceSeconds, setPaceSeconds] = useState<number | null>(null)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [pickerField, setPickerField] = useState<PickerField | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('Coming soon')
  const [calculatedField, setCalculatedField] = useState<'distance' | 'time' | 'pace' | null>(null)
  const [flashField, setFlashField] = useState<'distance' | 'time' | 'pace' | null>(null)
  const [lastChanged, setLastChanged] = useState<'time' | 'pace'>('time')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [shareData, setShareData] = useState<ShareData | null>(null)

  const distance = parseFloat(distanceStr) || 0

  // Prevent background scroll when picker is open
  useEffect(() => {
    document.body.style.overflow = pickerField ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [pickerField])

  const hasDistance = distance > 0
  const hasTime = timeSeconds !== null
  const hasPace = paceSeconds !== null

  const triggerFlash = (field: 'distance' | 'time' | 'pace') => {
    setFlashField(null)
    requestAnimationFrame(() => setFlashField(field))
    setTimeout(() => setFlashField(null), 1650)
  }

  const handleCalculate = () => {
    if (!hasDistance && !hasTime && !hasPace) {
      showToast('Please set any two of the following: distance, time, or pace.')
      return
    }
    if (hasDistance && hasTime && !hasPace) {
      setPaceSeconds(timeSeconds! / distance)
      setCalculatedField('pace'); triggerFlash('pace')
    } else if (hasDistance && hasPace && !hasTime) {
      setTimeSeconds(paceSeconds! * distance)
      setCalculatedField('time'); triggerFlash('time')
    } else if (hasTime && hasPace && !hasDistance) {
      setDistanceStr(String(Math.round(timeSeconds! / paceSeconds! * 1000) / 1000))
      setCalculatedField('distance'); triggerFlash('distance')
    } else if (hasDistance && hasTime && hasPace) {
      if (lastChanged === 'time') {
        setPaceSeconds(timeSeconds! / distance)
        setCalculatedField('pace'); triggerFlash('pace')
      } else {
        setTimeSeconds(paceSeconds! * distance)
        setCalculatedField('time'); triggerFlash('time')
      }
    }
  }

  const showToast = (msg = 'Coming soon') => {
    setToastMsg(msg)
    setToastVisible(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastVisible(false), 2500)
  }

  const handlePreset = (label: string, km: number) => {
    setActivePreset(label)
    setDistanceStr(String(km))
    setCalculatedField(null)
  }

  const handleReset = () => {
    setTimeSeconds(null)
    setPaceSeconds(null)
    setDistanceStr('')
    setActivePreset(null)
    setCalculatedField(null)
  }

  return (
    <div
      style={{
        background: '#131313',
        minHeight: '100dvh',
        color: 'white',
        fontFamily: "'Lexend', sans-serif",
        maxWidth: 430,
        margin: '0 auto',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── Fixed top chrome ── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 430,
          zIndex: 20,
          background: '#131313',
        }}
      >
        {/* Status bar */}
        <div
          style={{
            height: STATUS_BAR_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 9px',
          }}
        >
          {/* Time */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span
              style={{
                fontFamily: 'system-ui, sans-serif',
                fontWeight: 600,
                fontSize: 15,
                color: 'white',
                letterSpacing: 0,
              }}
            >
              {currentTime}
            </span>
          </div>
          {/* Dynamic Island */}
          <div
            style={{
              width: 125,
              height: 34,
              background: 'black',
              borderRadius: 20,
              flexShrink: 0,
            }}
          />
          {/* Status icons */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={imgStatusIcons} alt="" style={{ width: 85, height: 13 }} />
          </div>
        </div>

        {/* App header */}
        <div
          style={{
            height: HEADER_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 900,
                fontStyle: 'italic',
                fontSize: 24,
                letterSpacing: 1,
                color: 'white',
                lineHeight: 1.1,
              }}
            >
              KINETIC
            </span>
            <span
              style={{
                fontFamily: "'Lexend', sans-serif",
                fontWeight: 400,
                fontSize: 12,
                color: '#C4C9AC',
                lineHeight: '16px',
              }}
            >
              Calculate your pace, time, or distance
            </span>
          </div>

          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              flexShrink: 0,
            }}
          >
            <img src={imgSettings} alt="Settings" style={{ width: 20, height: 20 }} />
          </button>
        </div>
      </div>

      {/* Main Content — offset by fixed header height */}
      <div style={{ paddingTop: FIXED_TOP_H, padding: `${FIXED_TOP_H + 24}px 24px 40px`, display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Top Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Calculator Module */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Distance Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  fontFamily: "'Lexend', sans-serif",
                  fontWeight: 400,
                  fontSize: 10,
                  color: calculatedField === 'distance' ? '#C6F135' : '#C4C9AC',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  lineHeight: '16px',
                }}
              >
                DISTANCE (KM)
              </div>

              <div
                className={flashField === 'distance' ? 'calc-flash' : undefined}
                style={{
                  background: distanceFocused ? '#1A1E00' : '#353535',
                  borderRadius: '2px 2px 0 0',
                  borderBottom: `2px solid ${distanceFocused ? '#C3F400' : 'transparent'}`,
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'background 0.15s, border-color 0.15s',
                }}
              >
                <input
                  value={distanceStr}
                  onChange={e => { setDistanceStr(e.target.value); setActivePreset(null); setCalculatedField(null) }}
                  onFocus={() => setDistanceFocused(true)}
                  onBlur={() => setDistanceFocused(false)}
                  inputMode="decimal"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontFamily: "'Lexend', sans-serif",
                    fontWeight: 500,
                    fontSize: 36,
                    letterSpacing: 1,
                    lineHeight: '40px',
                    outline: 'none',
                    flex: 1,
                    minWidth: 0,
                    padding: 0,
                  }}
                  placeholder=""
                />
                {distanceFocused && distanceStr && (
                  <button
                    onMouseDown={e => { e.preventDefault(); setDistanceStr(''); setActivePreset(null); setCalculatedField(null) }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <img src={imgClearX} alt="Clear" style={{ width: 20, height: 20 }} />
                  </button>
                )}
                {distanceStr && (
                  <span
                    style={{
                      fontFamily: "'Lexend', sans-serif",
                      fontWeight: 500,
                      fontSize: 18,
                      letterSpacing: 1,
                      color: distanceFocused ? '#C4C9AC' : 'white',
                      flexShrink: 0,
                    }}
                  >
                    KM
                  </span>
                )}
              </div>

              {/* Preset chips - horizontally scrollable */}
              <div style={{ overflowX: 'auto', paddingBottom: 4, marginTop: -4 }} className="no-scrollbar">
                <div style={{ display: 'flex', gap: 8, padding: '4px 0', width: 'max-content' }}>
                  {PRESETS.map(p => {
                    const isActive = activePreset === p.label
                    return (
                      <button
                        key={p.label}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => handlePreset(p.label, p.km)}
                        style={{
                          background: '#0E0E0E',
                          border: isActive ? '1px solid rgba(195,244,0,0.5)' : '1px solid transparent',
                          borderRadius: 2,
                          padding: '7px 16px',
                          cursor: 'pointer',
                          fontFamily: "'Lexend', sans-serif",
                          fontWeight: 400,
                          fontSize: 12,
                          letterSpacing: 0.6,
                          textTransform: 'uppercase',
                          color: isActive ? '#C3F400' : '#E5E2E1',
                          whiteSpace: 'nowrap',
                          lineHeight: '16px',
                        }}
                      >
                        {p.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Time + Pace Inputs */}
            <div style={{ display: 'flex', gap: 12 }}>
              {/* Time */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "'Lexend', sans-serif",
                    fontWeight: 400,
                    fontSize: 10,
                    color: calculatedField === 'time' ? '#C6F135' : '#C4C9AC',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    lineHeight: '16px',
                  }}
                >
                  TIME (HH:MM:SS)
                </div>
                <button
                  onClick={() => setPickerField('time')}
                  className={flashField === 'time' ? 'calc-flash' : undefined}
                  style={{
                    background: pickerField === 'time' ? '#1A1E00' : '#353535',
                    border: 'none',
                    borderBottom: pickerField === 'time' ? '2px solid #C3F400' : '2px solid transparent',
                    borderRadius: '2px 2px 0 0',
                    height: 64,
                    padding: '0 8px',
                    cursor: 'pointer',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {timeSeconds !== null && (
                    <span
                      style={{
                        fontFamily: "'Lexend', sans-serif",
                        fontWeight: 500,
                        fontSize: 16,
                        color: 'white',
                        letterSpacing: 1,
                      }}
                    >
                      {formatHMS(timeSeconds)}
                    </span>
                  )}
                </button>
              </div>

              {/* Pace */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "'Lexend', sans-serif",
                    fontWeight: 400,
                    fontSize: 10,
                    color: calculatedField === 'pace' ? '#C6F135' : '#C4C9AC',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    lineHeight: '16px',
                  }}
                >
                  PACE (MM:SS /KM)
                </div>
                <button
                  onClick={() => setPickerField('pace')}
                  className={flashField === 'pace' ? 'calc-flash' : undefined}
                  style={{
                    background: pickerField === 'pace' ? '#1A1E00' : '#353535',
                    border: 'none',
                    borderBottom: pickerField === 'pace' ? '2px solid #C3F400' : '2px solid transparent',
                    borderRadius: '2px 2px 0 0',
                    height: 64,
                    padding: '0 8px',
                    cursor: 'pointer',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {paceSeconds !== null && (
                    <span
                      style={{
                        fontFamily: "'Lexend', sans-serif",
                        fontWeight: 500,
                        fontSize: 16,
                        color: 'white',
                        letterSpacing: 1,
                      }}
                    >
                      {formatMS(paceSeconds)}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              fontFamily: "'Lexend', sans-serif",
              fontWeight: 400,
              fontSize: 10,
              color: 'rgba(196,201,172,0.6)',
              textAlign: 'center',
              lineHeight: '16px',
            }}
          >
            Tip: Tap to set any two of the following: distance, time, or pace.
          </div>

          {/* CTA Button */}
          <button
            onClick={handleCalculate}
            style={{
              background: 'linear-gradient(171deg, rgb(195,244,0) 0%, rgb(255,255,255) 100%)',
              border: 'none',
              borderRadius: 2,
              padding: '14px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              boxShadow: '0px 4px 12px rgba(195,244,0,0.15)',
            }}
          >
            <img src={imgLightning} alt="" style={{ width: 16, height: 20 }} />
            <span
              style={{
                fontFamily: "'Lexend', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: '#161E00',
                lineHeight: '28px',
              }}
            >
              START CALCULATING
            </span>
          </button>

          {/* Share / Reset */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              onClick={() => {
                if (calculatedField === null) {
                  showToast('Please enter the data and perform the calculations before sharing.')
                } else {
                  setShareData({
                    mode: 'PACE CALCULATOR',
                    distanceKm: distance > 0 ? distance : undefined,
                    totalSeconds: timeSeconds ?? undefined,
                    paceSeconds: paceSeconds ?? undefined,
                  })
                }
              }}
              style={{
                background: 'none',
                border: '1px solid rgba(68,73,51,0.15)',
                borderRadius: 2,
                padding: '11px 1px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                height: 40,
              }}
            >
              <img src={imgShare} alt="" style={{ width: 15, height: 15 }} />
              <span
                style={{
                  fontFamily: "'Lexend', sans-serif",
                  fontWeight: 400,
                  fontSize: 14,
                  color: '#C4C9AC',
                  letterSpacing: 0.7,
                  textTransform: 'uppercase',
                  lineHeight: '20px',
                }}
              >
                SHARE
              </span>
            </button>

            <button
              onClick={handleReset}
              style={{
                background: 'none',
                border: '1px solid rgba(68,73,51,0.15)',
                borderRadius: 2,
                padding: '13px 1px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                height: 40,
              }}
            >
              <img src={imgReset} alt="" style={{ width: 15, height: 15 }} />
              <span
                style={{
                  fontFamily: "'Lexend', sans-serif",
                  fontWeight: 400,
                  fontSize: 14,
                  color: '#C4C9AC',
                  letterSpacing: 0.7,
                  textTransform: 'uppercase',
                  lineHeight: '20px',
                }}
              >
                RESET
              </span>
            </button>
          </div>
        </div>

        {/* Common Tools */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Section Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: "'Lexend', sans-serif",
                  fontWeight: 400,
                  fontSize: 10,
                  color: '#C4C9AC',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  lineHeight: '16px',
                  whiteSpace: 'nowrap',
                }}
              >
                Common Tools
              </span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: 'rgba(68,73,51,0.45)',
                }}
              />
            </div>
            <p
              style={{
                fontFamily: "'Lexend', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                color: 'white',
                margin: 0,
                lineHeight: '20px',
              }}
            >
              Quick access to your training toolkit
            </p>
          </div>

          {/* Tools Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <ToolCard
                icon={imgFlag}
                title="Pace Planning"
                desc="Build your race plan"
                onClick={() => onNavigate('pace-planning')}
              />
              <ToolCard
                icon={imgCircleX}
                title="Running Shoe"
                desc="Check mileage & fit"
                iconInset
                onClick={() => onNavigate('running-shoes')}
              />
            </div>
            <ToolCard
              icon={imgCalculator}
              title="Track Calculations"
              desc="Laps, splits & intervals"
              wide
              onClick={() => showToast()}
            />
          </div>
        </div>
      </div>

      {/* Toast */}
      <div
        style={{
          position: 'fixed',
          bottom: 40,
          left: '50%',
          transform: `translateX(-50%) translateY(${toastVisible ? 0 : 16}px)`,
          opacity: toastVisible ? 1 : 0,
          transition: 'opacity 0.2s, transform 0.2s',
          background: 'rgba(30,30,30,0.95)',
          border: '1px solid rgba(195,244,0,0.2)',
          borderRadius: 8,
          padding: '10px 20px',
          pointerEvents: 'none',
          zIndex: 100,
          maxWidth: 'calc(144vw - 24px)',
          textAlign: 'center',
        }}
      >
        <span style={{ fontFamily: "'Lexend', sans-serif", fontSize: 13, color: '#C4C9AC' }}>
          {toastMsg}
        </span>
      </div>

      {/* Time Picker Modal */}
      {pickerField && (
        <TimePicker
          field={pickerField}
          initialSeconds={
            pickerField === 'time' ? (timeSeconds ?? 0) : (paceSeconds ?? 0)
          }
          onSave={secs => {
            if (pickerField === 'time') { setTimeSeconds(secs); setLastChanged('time') }
            else { setPaceSeconds(secs); setLastChanged('pace') }
            setPickerField(null)
            setCalculatedField(null)
          }}
          onCancel={() => setPickerField(null)}
        />
      )}

      {/* Share card modal */}
      {shareData && <ShareCardModal data={shareData} onClose={() => setShareData(null)} />}
    </div>
  )
}

function ToolCard({
  icon,
  title,
  desc,
  iconInset,
  wide,
  onClick,
}: {
  icon: string
  title: string
  desc: string
  iconInset?: boolean
  wide?: boolean
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#353535',
        border: '1px solid rgba(68,73,51,0.15)',
        borderRadius: 2,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        height: 96,
        flex: wide ? undefined : '1 0 0',
        width: wide ? '100%' : undefined,
        cursor: 'pointer',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          background: '#0E0E0E',
          borderRadius: 2,
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {iconInset ? (
          <div style={{ width: 16, height: 16, position: 'relative', overflow: 'clip' }}>
            <img
              src={icon}
              alt=""
              style={{ position: 'absolute', inset: '8.33%', width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }}
            />
          </div>
        ) : (
          <img src={icon} alt="" style={{ width: 16, height: 16 }} />
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            color: 'white',
            lineHeight: '18px',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: 10,
            color: '#C4C9AC',
            lineHeight: '14px',
          }}
        >
          {desc}
        </div>
      </div>
    </div>
  )
}
