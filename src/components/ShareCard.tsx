import { useState, useRef } from 'react'
import { toPng } from 'html-to-image'

// ── Types ───────────────────────────────────────────────────────────────────

export interface ShareSegment {
  label: string
  paceSeconds: number
  splitSeconds: number
  cumulativeSeconds: number
}

export interface ShareData {
  mode: string                  // e.g. "PACE CALCULATOR" | "PACE PLANNING" | "CUSTOM SPLITS"
  distanceKm?: number
  totalSeconds?: number
  paceSeconds?: number
  segments?: ShareSegment[]
}

// ── Background presets ──────────────────────────────────────────────────────

const BG_PRESETS = [
  { id: 'noir',    bg: '#0D0D0D' },
  { id: 'forest',  bg: 'linear-gradient(150deg, #060D00 0%, #0F1800 100%)' },
  { id: 'arctic',  bg: 'linear-gradient(150deg, #05080F 0%, #0D1520 100%)' },
  { id: 'ember',   bg: 'linear-gradient(150deg, #0E0500 0%, #1C0C00 100%)' },
  { id: 'dusk',    bg: 'linear-gradient(150deg, #09050F 0%, #130820 100%)' },
]

// ── QR code placeholder ─────────────────────────────────────────────────────

function QRPlaceholder({ size = 56 }: { size?: number }) {
  const n = 21
  const cells: [number, number][] = []

  function finder(ox: number, oy: number) {
    for (let i = 0; i < 7; i++) {
      cells.push([ox + i, oy], [ox + i, oy + 6])
      cells.push([ox, oy + i], [ox + 6, oy + i])
    }
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++)
        cells.push([ox + 2 + c, oy + 2 + r])
  }

  finder(0, 0); finder(14, 0); finder(0, 14)

  // Timing strips
  for (let i = 8; i <= 12; i += 2) { cells.push([i, 6]); cells.push([6, i]) }

  // Data area — hardcoded visual modules
  const data: [number, number][] = [
    [7,0],[9,0],[11,0],[13,0],[15,0],[18,0],[20,0],
    [8,1],[10,1],[14,1],[16,1],[19,1],
    [7,2],[9,2],[12,2],[15,2],[17,2],[20,2],
    [8,3],[11,3],[13,3],[16,3],[19,3],
    [7,4],[10,4],[12,4],[14,4],[17,4],[20,4],
    [8,5],[9,5],[13,5],[15,5],[18,5],
    [7,7],[8,7],[11,7],[14,7],[16,7],[19,7],[20,7],
    [9,8],[12,8],[15,8],[17,8],[20,8],
    [7,9],[10,9],[13,9],[16,9],[18,9],
    [8,10],[11,10],[14,10],[17,10],[19,10],[20,10],
    [7,11],[9,11],[12,11],[15,11],[18,11],
    [8,12],[10,12],[13,12],[16,12],[19,12],[20,12],
    [7,13],[11,13],[14,13],[17,13],
    [7,14],[8,14],[10,14],[13,14],[16,14],[19,14],[20,14],
    [9,15],[12,15],[15,15],[18,15],
    [7,16],[10,16],[13,16],[16,16],[19,16],[20,16],
    [8,17],[11,17],[14,17],[17,17],
    [7,18],[9,18],[12,18],[15,18],[18,18],[20,18],
    [8,19],[10,19],[13,19],[16,19],[19,19],
    [7,20],[9,20],[11,20],[14,20],[17,20],[20,20],
  ]
  cells.push(...data)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} style={{ display: 'block', borderRadius: 4 }}>
      <rect width={n} height={n} fill="white" />
      {cells.map(([col, row], i) => (
        <rect key={i} x={col} y={row} width={1} height={1} fill="#111" />
      ))}
    </svg>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmtMS(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function fmtHMS(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// ── Card ────────────────────────────────────────────────────────────────────

function Card({ data, bgIdx }: { data: ShareData; bgIdx: number }) {
  const bg = BG_PRESETS[bgIdx]
  const hasSegs = data.segments && data.segments.length > 0

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        background: bg.bg,
      }}
    >
      {/* Lime accent bar */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #C3F400 0%, rgba(195,244,0,0.2) 100%)' }} />

      {/* Subtle corner glow */}
      <div style={{
        position: 'absolute', top: 3, right: 0, width: 160, height: 80,
        background: 'radial-gradient(ellipse at top right, rgba(195,244,0,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Card header */}
      <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontStyle: 'italic', fontSize: 20, letterSpacing: 1, color: '#C3F400', lineHeight: 1 }}>
            KINETIC
          </div>
          <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 9, color: '#555', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 3 }}>
            {data.mode}
          </div>
        </div>
        <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 10, color: '#444', paddingTop: 3 }}>
          {today()}
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 20px' }} />

      {/* Stats */}
      <div style={{ padding: '20px 20px 16px' }}>
        {data.distanceKm !== undefined && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 9, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>
              DISTANCE
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 700, fontSize: 56, color: '#C3F400', letterSpacing: -2, lineHeight: 1 }}>
                {data.distanceKm.toFixed(2)}
              </span>
              <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: 15, color: '#C4C9AC', letterSpacing: 1 }}>KM</span>
            </div>
          </div>
        )}

        {data.paceSeconds !== undefined && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 9, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>
              PACE
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 700, fontSize: 40, color: 'white', letterSpacing: -1, lineHeight: 1 }}>
                {fmtMS(data.paceSeconds)}
              </span>
              <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 14, color: '#555' }}>/KM</span>
            </div>
          </div>
        )}

        {data.totalSeconds !== undefined && (
          <div>
            <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 9, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>
              TIME
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 700, fontSize: 40, color: 'white', letterSpacing: -1, lineHeight: 1 }}>
                {fmtHMS(data.totalSeconds)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Segments */}
      {hasSegs && (
        <>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 20px' }} />
          <div style={{ padding: '12px 20px 16px' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', marginBottom: 6 }}>
              {['SPLIT', 'PACE', 'TIME', 'CUM.'].map(h => (
                <div key={h} style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 8, color: '#444', letterSpacing: 0.8, textTransform: 'uppercase', textAlign: 'center' }}>
                  {h}
                </div>
              ))}
            </div>
            {data.segments!.map((seg, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '5px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: 11, color: '#C3F400', textAlign: 'center' }}>{seg.label}</div>
                <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 11, color: '#C4C9AC', textAlign: 'center' }}>{fmtMS(seg.paceSeconds)}</div>
                <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 11, color: '#666', textAlign: 'center' }}>{fmtMS(seg.splitSeconds)}</div>
                <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 11, color: '#666', textAlign: 'center' }}>{fmtHMS(seg.cumulativeSeconds)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 20px' }} />
      <div style={{ padding: '14px 20px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 9, color: '#3A3A3A', letterSpacing: 0.5, marginBottom: 3 }}>
            Scan to download
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontStyle: 'italic', fontSize: 18, color: '#C3F400', letterSpacing: 1, lineHeight: 1 }}>
            KINETIC
          </div>
          <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 8, color: '#2E2E2E', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 }}>
            RUNNING CALCULATOR
          </div>
        </div>
        <div style={{ borderRadius: 6, overflow: 'hidden', flexShrink: 0, boxShadow: '0 0 0 3px rgba(195,244,0,0.12)' }}>
          <QRPlaceholder size={56} />
        </div>
      </div>
    </div>
  )
}

// ── Modal ───────────────────────────────────────────────────────────────────

interface ShareCardModalProps {
  data: ShareData
  onClose: () => void
}

export function ShareCardModal({ data, onClose }: ShareCardModalProps) {
  const [bgIdx, setBgIdx] = useState(0)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = () => {
    setToast(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(false), 2500)
  }

  const handleSave = async () => {
    if (!cardRef.current || saving) return
    setSaving(true)
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true })

      if (navigator.canShare && navigator.canShare({ files: [new File([], '')] })) {
        const res = await fetch(dataUrl)
        const blob = await res.blob()
        const file = new File([blob], `kinetic-${Date.now()}.png`, { type: 'image/png' })
        await navigator.share({ files: [file], title: 'KINETIC' })
      } else {
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `kinetic-${Date.now()}.png`
        a.click()
      }
      showToast()
    } catch {
      // user cancelled share or error — silent
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column' }}>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div style={{
        position: 'relative', marginTop: 'auto', background: '#181818',
        borderRadius: '20px 20px 0 0', paddingBottom: 40,
        maxHeight: '92dvh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, background: '#333', borderRadius: 2 }} />
        </div>

        {/* Sheet header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 24px 14px', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#666', fontFamily: "'Lexend', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: 1, cursor: 'pointer', padding: 0 }}
          >
            CLOSE
          </button>
          <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 700, fontSize: 15, color: 'white' }}>
            Share Card
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: 'none',
              border: 'none',
              color: '#C6F135',
              fontFamily: "'Lexend', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 1,
              cursor: saving ? 'default' : 'pointer',
              padding: 0,
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? 'SAVING…' : 'SAVE'}
          </button>
        </div>

        {/* Card preview */}
        <div style={{ overflowY: 'auto', padding: '0 24px 4px', flex: 1 }} className="no-scrollbar">
          <div ref={cardRef}>
            <Card data={data} bgIdx={bgIdx} />
          </div>
        </div>

        {/* Background selector */}
        <div style={{ padding: '16px 24px 0', flexShrink: 0 }}>
          <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 9, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>
            BACKGROUND
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }} className="no-scrollbar">
            {BG_PRESETS.map((preset, i) => (
              <button
                key={preset.id}
                onClick={() => setBgIdx(i)}
                style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: preset.bg, border: 'none',
                  outline: bgIdx === i ? '2px solid #C3F400' : '2px solid rgba(255,255,255,0.08)',
                  outlineOffset: 2, cursor: 'pointer', flexShrink: 0,
                  transition: 'outline-color 0.15s',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      <div style={{
        position: 'fixed',
        bottom: 56,
        left: '50%',
        transform: `translateX(-50%) translateY(${toast ? 0 : 12}px)`,
        opacity: toast ? 1 : 0,
        transition: 'opacity 0.2s, transform 0.2s',
        background: 'rgba(30,30,30,0.95)',
        border: '1px solid rgba(195,244,0,0.2)',
        borderRadius: 8,
        padding: '10px 20px',
        pointerEvents: 'none',
        zIndex: 100,
        whiteSpace: 'nowrap',
      }}>
        <span style={{ fontFamily: "'Lexend', sans-serif", fontSize: 13, color: '#C4C9AC' }}>
          Card saved.
        </span>
      </div>
    </div>
  )
}
