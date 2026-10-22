import { useState, useCallback, useEffect, useRef } from 'react'
import TimePicker from '../components/TimePicker'
import { ShareCardModal, type ShareData, type ShareSegment } from '../components/ShareCard'

const assetPathPrefix = '/assets'
const imgBack = `${assetPathPrefix}/04f96.svg`
const imgSharePP = `${assetPathPrefix}/6366a.svg`
const imgResetPP = `${assetPathPrefix}/aa39f.svg`
const imgStatusIcons = `${assetPathPrefix}/76cef.svg`

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

type Tab = 'FULL' | 'HALF' | 'CUSTOMER'

interface Checkpoint {
  label: string
  km: number
}

interface CustomSegment {
  km: number
  paceSeconds: number
}

const FULL_CHECKPOINTS: Checkpoint[] = [
  { label: '5KM', km: 5 },
  { label: '10KM', km: 10 },
  { label: '15KM', km: 15 },
  { label: '20KM', km: 20 },
  { label: 'HALF', km: 21.0975 },
  { label: '25KM', km: 25 },
  { label: '30KM', km: 30 },
  { label: '35KM', km: 35 },
  { label: '40KM', km: 40 },
  { label: 'FINISH', km: 42.195 },
]

const HALF_CHECKPOINTS: Checkpoint[] = [
  { label: '5KM', km: 5 },
  { label: '10KM', km: 10 },
  { label: '15KM', km: 15 },
  { label: '20KM', km: 20 },
  { label: 'FINISH', km: 21.0975 },
]

const SPLIT_PRESETS = [
  { label: '10KM', km: 10 },
  { label: '5KM', km: 5 },
  { label: '1Mi', km: 1.60934 },
  { label: '1KM', km: 1 },
  { label: '800M', km: 0.8 },
  { label: '400M', km: 0.4 },
  { label: '200M', km: 0.2 },
  { label: '100M', km: 0.1 },
]

function getCheckpoints(tab: Tab): Checkpoint[] {
  if (tab === 'HALF') return HALF_CHECKPOINTS
  return FULL_CHECKPOINTS
}

function segmentKm(checkpoints: Checkpoint[], index: number): number {
  return index === 0 ? checkpoints[0].km : checkpoints[index].km - checkpoints[index - 1].km
}

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

interface TabState {
  timeSeconds: number | null
  paceSeconds: number | null
  rowPaceOverrides: Record<number, number>
}

function fmtKmLabel(km: number): string {
  const r = Math.round(km * 100) / 100
  return Number.isInteger(r) ? `${r}KM` : `${parseFloat(r.toFixed(2))}KM`
}

// ── Distance input sheet (for Add / Edit) ──────────────────────────────────
interface DistanceSheetProps {
  title: string
  subtitle?: string
  initialStr: string
  cancelLabel: string
  confirmLabel: string
  onConfirm: (km: number) => void
  onCancel: () => void
}

function DistanceSheet({ title, subtitle, initialStr, cancelLabel, confirmLabel, onConfirm, onCancel }: DistanceSheetProps) {
  const [distStr, setDistStr] = useState(initialStr)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [])

  const km = parseFloat(distStr)
  const valid = !isNaN(km) && km > 0

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column' }}>
      {/* Scrim */}
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }} onClick={onCancel} />

      {/* Sheet */}
      <div style={{ background: '#1A1A1A', borderRadius: '20px 20px 0 0', paddingBottom: 32 }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 40, height: 4, background: '#3A3A3A', borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px' }}>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', color: '#888', fontFamily: "'Lexend', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: 1, cursor: 'pointer', padding: 0 }}
          >
            {cancelLabel}
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 700, fontSize: 16, color: 'white' }}>{title}</span>
            {subtitle && (
              <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 11, color: '#888', letterSpacing: 0.5, textTransform: 'uppercase' }}>{subtitle}</span>
            )}
          </div>
          <button
            onClick={() => valid && onConfirm(km)}
            style={{ background: 'none', border: 'none', color: valid ? '#C6F135' : '#555', fontFamily: "'Lexend', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, cursor: valid ? 'pointer' : 'default', padding: 0 }}
          >
            {confirmLabel}
          </button>
        </div>

        {/* Distance input */}
        <div style={{ padding: '16px 24px 0' }}>
          <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 10, color: '#c4c9ac', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
            DISTANCE (KM)
          </div>
          <div style={{
            background: focused ? '#1A1E00' : '#252525',
            borderBottom: focused ? '2px solid #C3F400' : '2px solid transparent',
            borderRadius: '4px 4px 0 0',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'background 0.15s, border-color 0.15s',
          }}>
            <input
              ref={inputRef}
              value={distStr}
              onChange={e => { setDistStr(e.target.value); setActivePreset(null) }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              inputMode="decimal"
              style={{
                background: 'none', border: 'none', color: 'white',
                fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: 32,
                outline: 'none', flex: 1, minWidth: 0, padding: 0,
              }}
              placeholder=""
            />
            <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: 16, color: '#c4c9ac', flexShrink: 0 }}>KM</span>
          </div>

          {/* Preset chips */}
          <div style={{ overflowX: 'auto', paddingBottom: 4, marginTop: 12 }} className="no-scrollbar">
            <div style={{ display: 'flex', gap: 8, width: 'max-content' }}>
              {SPLIT_PRESETS.map(p => (
                <button
                  key={p.label}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { setDistStr(String(p.km)); setActivePreset(p.label) }}
                  style={{
                    background: '#0E0E0E',
                    border: activePreset === p.label ? '1px solid rgba(195,244,0,0.5)' : '1px solid transparent',
                    borderRadius: 2,
                    padding: '7px 16px',
                    cursor: 'pointer',
                    fontFamily: "'Lexend', sans-serif",
                    fontWeight: 400,
                    fontSize: 12,
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                    color: activePreset === p.label ? '#C3F400' : '#E5E2E1',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── PacePlanning ────────────────────────────────────────────────────────────
export default function PacePlanning({ onBack }: { onBack: () => void }) {
  const currentTime = useTime()
  const [tab, setTab] = useState<Tab>('FULL')

  // Per-tab state for FULL / HALF
  const emptyTabState = (): TabState => ({ timeSeconds: null, paceSeconds: null, rowPaceOverrides: {} })
  const [tabStates, setTabStates] = useState<Record<string, TabState>>({
    FULL: emptyTabState(),
    HALF: emptyTabState(),
  })
  const updateTabState = (updates: Partial<TabState>) =>
    setTabStates(prev => ({ ...prev, [tab]: { ...(prev[tab] ?? emptyTabState()), ...updates } }))

  const { timeSeconds, paceSeconds, rowPaceOverrides } = tabStates[tab] ?? emptyTabState()
  const setTimeSeconds = (v: number | null) => updateTabState({ timeSeconds: v })
  const setPaceSeconds = (v: number | null) => updateTabState({ paceSeconds: v })
  const setRowPaceOverrides = (fn: (prev: Record<number, number>) => Record<number, number>) =>
    setTabStates(prev => {
      const cur = prev[tab] ?? emptyTabState()
      return { ...prev, [tab]: { ...cur, rowPaceOverrides: fn(cur.rowPaceOverrides) } }
    })

  const [pickerField, setPickerField] = useState<'time' | 'pace' | null>(null)
  const [editingRow, setEditingRow] = useState<number | null>(null)

  // CUSTOMER tab state
  const [customSegments, setCustomSegments] = useState<CustomSegment[]>([])
  const [addStep, setAddStep] = useState<null | 'distance' | 'pace'>(null)
  const [pendingDistStr, setPendingDistStr] = useState('')
  const [editDistIdx, setEditDistIdx] = useState<number | null>(null)
  const [editPaceIdx, setEditPaceIdx] = useState<number | null>(null)
  const [shareData, setShareData] = useState<ShareData | null>(null)
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastVisible(false), 3000)
  }

  const handleShare = () => {
    if (tab === 'CUSTOMER') {
      if (customSegments.length === 0) {
        showToast('Please enter the data and perform the calculations before sharing.')
        return
      }
      let cum = 0
      const segments: ShareSegment[] = customSegments.map(seg => {
        const split = seg.km * seg.paceSeconds
        cum += split
        return { label: fmtKmLabel(seg.km), paceSeconds: seg.paceSeconds, splitSeconds: split, cumulativeSeconds: cum }
      })
      setShareData({ mode: 'CUSTOM SPLITS', distanceKm: customTotalKm, totalSeconds: customTotalSecs, paceSeconds: customAvgPace ?? undefined, segments })
    } else {
      if (timeSeconds === null || paceSeconds === null) {
        showToast('Please enter the data and perform the calculations before sharing.')
        return
      }
      const segments: ShareSegment[] = rows.map(({ cp, rowPace, splitSecs, cumSecs }) => ({
        label: cp.label,
        paceSeconds: rowPace ?? 0,
        splitSeconds: splitSecs ?? 0,
        cumulativeSeconds: cumSecs ?? 0,
      }))
      setShareData({ mode: 'PACE PLANNING', distanceKm: totalKm, totalSeconds: timeSeconds, paceSeconds, segments })
    }
  }

  const checkpoints = getCheckpoints(tab)
  const totalKm = checkpoints[checkpoints.length - 1].km
  const globalPace = paceSeconds ?? (timeSeconds !== null ? timeSeconds / totalKm : null)

  // CUSTOMER computed
  const customTotalKm = customSegments.reduce((s, seg) => s + seg.km, 0)
  const customTotalSecs = customSegments.reduce((s, seg) => s + seg.km * seg.paceSeconds, 0)
  const customAvgPace = customTotalKm > 0 ? customTotalSecs / customTotalKm : null

  // Tab switch — no state reset, each tab preserves its own data
  const handleTabChange = (t: Tab) => {
    setTab(t)
    setPickerField(null)
    setEditingRow(null)
    setAddStep(null)
    setEditDistIdx(null)
    setEditPaceIdx(null)
  }

  const handleReset = () => {
    if (tab === 'CUSTOMER') {
      setCustomSegments([])
    } else {
      setTabStates(prev => ({ ...prev, [tab]: emptyTabState() }))
    }
  }

  const handleRowPaceEdit = useCallback((rowIdx: number, secs: number) => {
    setTabStates(prev => {
      const cur = prev[tab] ?? emptyTabState()
      const gp = cur.paceSeconds ?? (cur.timeSeconds !== null ? cur.timeSeconds / totalKm : null)
      const frozen: Record<number, number> = {}
      checkpoints.forEach((_, i) => {
        if (i === rowIdx) return
        const effective = cur.rowPaceOverrides[i] ?? gp
        if (effective !== null) frozen[i] = effective
      })
      const next = { ...frozen, [rowIdx]: secs }
      const totalSecs = checkpoints.reduce((sum, _, i) => {
        const p = next[i] ?? gp
        return p !== null ? sum + p * segmentKm(checkpoints, i) : sum
      }, 0)
      const newState: TabState = {
        rowPaceOverrides: next,
        timeSeconds: totalSecs > 0 ? totalSecs : cur.timeSeconds,
        paceSeconds: totalSecs > 0 ? totalSecs / totalKm : cur.paceSeconds,
      }
      return { ...prev, [tab]: newState }
    })
    setEditingRow(null)
    setPickerField(null)
  }, [tab, checkpoints, totalKm])

  const rows = checkpoints.map((cp, i) => {
    const segKm = segmentKm(checkpoints, i)
    const rowPace = rowPaceOverrides[i] ?? globalPace
    const splitSecs = rowPace !== null ? rowPace * segKm : null
    let cumSecs: number | null = null
    if (globalPace !== null) {
      cumSecs = 0
      for (let j = 0; j <= i; j++) {
        const p = rowPaceOverrides[j] ?? globalPace
        cumSecs += p * segmentKm(checkpoints, j)
      }
    }
    return { cp, rowPace, splitSecs, cumSecs }
  })

  // Split label for edit modals
  const splitLabel = (idx: number) => {
    const seg = customSegments[idx]
    if (!seg) return ''
    return `SPLIT${idx + 1}: ${fmtKmLabel(seg.km)}/${fmtMS(seg.paceSeconds)}`
  }

  return (
    <div style={{ background: '#131313', minHeight: '100dvh', color: 'white', fontFamily: "'Lexend', sans-serif", maxWidth: 430, margin: '0 auto', overflowX: 'hidden', position: 'relative' }}>

      {/* Fixed header */}
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, zIndex: 20, background: '#131313' }}>
        <div style={{ height: STATUS_BAR_H, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 9px' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 600, fontSize: 15, color: 'white', letterSpacing: 0 }}>{currentTime}</span>
          </div>
          <div style={{ width: 125, height: 34, background: 'black', borderRadius: 20, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={imgStatusIcons} alt="" style={{ width: 85, height: 13 }} />
          </div>
        </div>
        <div style={{ height: HEADER_H, display: 'flex', alignItems: 'center', gap: 4, padding: '0 24px 0 16px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, flexShrink: 0 }}>
            <img src={imgBack} alt="Back" style={{ width: 21, height: 21 }} />
          </button>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontStyle: 'italic', fontSize: 24, letterSpacing: 1, color: 'white', textTransform: 'uppercase' }}>
            Pace Planning
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ padding: `${FIXED_TOP_H + 24}px 24px 40px`, display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Tab selector */}
        <div style={{ background: '#0e0e0e', display: 'flex', gap: 4, padding: 4, borderRadius: 2 }}>
          {(['FULL', 'HALF', 'CUSTOMER'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              style={{
                flex: 1, background: tab === t ? '#353535' : 'none', border: 'none', borderRadius: 2,
                padding: '12px 16px', cursor: 'pointer', fontFamily: "'Lexend', sans-serif",
                fontWeight: 400, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase',
                color: tab === t ? '#ccff00' : '#e5e2e1',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── CUSTOMER tab ── */}
        {tab === 'CUSTOMER' ? (
          <>
            {/* Read-only summary (only when segments exist) */}
            {customSegments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Total distance */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 10, color: '#C4C9AC', letterSpacing: 1, textTransform: 'uppercase' }}>
                    DISTANCE (KM)
                  </div>
                  <div style={{ background: '#353535', borderRadius: '2px 2px 0 0', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: 36, color: '#C4C9AC', letterSpacing: 1 }}>
                      {customTotalKm.toFixed(2)}
                    </span>
                    <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: 18, color: '#C4C9AC' }}>KM</span>
                  </div>
                </div>

                {/* Time + Pace read-only */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 10, color: '#C4C9AC', letterSpacing: 1, textTransform: 'uppercase' }}>
                      TIME (HH:MM:SS)
                    </div>
                    <div style={{ background: '#353535', borderRadius: '2px 2px 0 0', height: 64, padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      {[Math.floor(customTotalSecs / 3600), Math.floor((customTotalSecs % 3600) / 60), Math.floor(customTotalSecs % 60)].map((val, i) => (
                        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: 22, color: '#C4C9AC', letterSpacing: 1, minWidth: 28, textAlign: 'center' }}>
                            {String(val).padStart(2, '0')}
                          </span>
                          {i < 2 && <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 18, color: '#C4C9AC' }}>:</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 10, color: '#C4C9AC', letterSpacing: 1, textTransform: 'uppercase' }}>
                      PACE (MM:SS /KM)
                    </div>
                    <div style={{ background: '#353535', borderRadius: '2px 2px 0 0', height: 64, padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      {customAvgPace !== null
                        ? [Math.floor(customAvgPace / 60), Math.floor(customAvgPace % 60)].map((val, i) => (
                          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: 22, color: '#C4C9AC', letterSpacing: 1, minWidth: 28, textAlign: 'center' }}>
                              {String(val).padStart(2, '0')}
                            </span>
                            {i < 1 && <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 18, color: '#C4C9AC' }}>:</span>}
                          </span>
                        ))
                        : <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: 22, color: '#C4C9AC' }}>--:--</span>
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ADD SPLIT button */}
            <button
              onClick={() => { setPendingDistStr(''); setAddStep('distance') }}
              style={{
                background: 'linear-gradient(171deg, rgb(195,244,0) 0%, rgb(255,255,255) 100%)',
                border: 'none', borderRadius: 2, padding: '14px 8px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', boxShadow: '0px 4px 12px rgba(195,244,0,0.15)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="#161E00" strokeWidth="1.5" fill="none" />
                <path d="M10 6v8M6 10h8" stroke="#161E00" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 700, fontSize: 18, color: '#161E00', lineHeight: '28px' }}>
                ADD SPLIT
              </span>
            </button>

            {/* Tip + table (only when segments exist) */}
            {customSegments.length > 0 && (
              <>
                <p style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 10, color: 'rgba(196,201,172,0.6)', margin: 0, lineHeight: '16px' }}>
                  💡Tip: Split distance &amp; paces (<span style={{ color: '#ccff00', textDecoration: 'underline' }}>green text</span>) can be edited by click.
                </p>

                {/* Custom segments table */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ background: 'rgba(68,73,51,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
                    {['DISTANCE', 'PACE', 'SPLIT', 'CUMULATIVE'].map((h, i) => (
                      <div key={h} style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 14, color: '#c4c9ac', letterSpacing: 0.7, textTransform: 'uppercase', textAlign: 'center', padding: '12px 0', width: i === 0 ? 80 : i === 3 ? 108 : 60 }}>
                        {h}
                      </div>
                    ))}
                  </div>
                  {customSegments.map((seg, i) => {
                    const splitSecs = seg.km * seg.paceSeconds
                    let cumSecs = 0
                    for (let j = 0; j <= i; j++) cumSecs += customSegments[j].km * customSegments[j].paceSeconds
                    return (
                      <div key={i} style={{ background: i % 2 === 1 ? 'rgba(68,73,51,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
                        <button
                          onClick={() => { setEditDistIdx(i); setEditPaceIdx(null) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 14, color: '#ccff00', letterSpacing: 0.7, textTransform: 'uppercase', textAlign: 'center', padding: '12px 0', width: 80 }}
                        >
                          {fmtKmLabel(seg.km)}
                        </button>
                        <button
                          onClick={() => { setEditPaceIdx(i); setEditDistIdx(null) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 14, color: '#ccff00', letterSpacing: 0.7, textAlign: 'center', padding: '12px 0', width: 60 }}
                        >
                          {fmtMS(seg.paceSeconds)}
                        </button>
                        <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 14, color: '#c4c9ac', letterSpacing: 0.7, textAlign: 'center', padding: '12px 0', width: 60 }}>
                          {fmtMS(splitSecs)}
                        </div>
                        <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 14, color: '#c4c9ac', letterSpacing: 0.7, textAlign: 'center', padding: '12px 0', width: 108 }}>
                          {fmtHMS(cumSecs)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          /* ── FULL / HALF tab content ── */
          <>
            {/* Time + Pace inputs */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 10, color: '#c4c9ac', letterSpacing: 1, textTransform: 'uppercase' }}>
                  TIME (HH:MM:SS)
                </div>
                <button
                  onClick={() => setPickerField('time')}
                  style={{ background: pickerField === 'time' ? '#1A1E00' : '#353535', border: 'none', borderBottom: pickerField === 'time' ? '2px solid #c3f400' : '2px solid transparent', borderRadius: '2px 2px 0 0', height: 64, padding: '0 8px', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                >
                  {(['hh', 'mm', 'ss'] as const).map((part, i) => {
                    const val = timeSeconds !== null
                      ? [Math.floor(timeSeconds / 3600), Math.floor((timeSeconds % 3600) / 60), Math.floor(timeSeconds % 60)][i]
                      : null
                    return (
                      <span key={part} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: 24, color: '#ccff00', letterSpacing: 1, minWidth: 32, textAlign: 'center' }}>
                          {val !== null ? String(val).padStart(2, '0') : '00'}
                        </span>
                        {i < 2 && <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 20, color: '#c4c9ac' }}>:</span>}
                      </span>
                    )
                  })}
                </button>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 10, color: '#c4c9ac', letterSpacing: 1, textTransform: 'uppercase' }}>
                  PACE (MM:SS /KM)
                </div>
                <button
                  onClick={() => setPickerField('pace')}
                  style={{ background: pickerField === 'pace' ? '#1A1E00' : '#353535', border: 'none', borderBottom: pickerField === 'pace' ? '2px solid #c3f400' : '2px solid transparent', borderRadius: '2px 2px 0 0', height: 64, padding: '0 8px', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                >
                  {(['mm', 'ss'] as const).map((part, i) => {
                    const val = paceSeconds !== null
                      ? [Math.floor(paceSeconds / 60), Math.floor(paceSeconds % 60)][i]
                      : null
                    return (
                      <span key={part} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: 24, color: '#ccff00', letterSpacing: 1, minWidth: 32, textAlign: 'center' }}>
                          {val !== null ? String(val).padStart(2, '0') : '00'}
                        </span>
                        {i < 1 && <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 20, color: '#c4c9ac' }}>:</span>}
                      </span>
                    )
                  })}
                </button>
              </div>
            </div>

            {/* Tip */}
            <p style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 10, color: 'rgba(196,201,172,0.6)', margin: 0, lineHeight: '16px' }}>
              💡Tip: Enter time or pace to automatically generate a split pace. Split paces (<span style={{ color: '#ccff00', textDecoration: 'underline' }}>green text</span>) can be edited by click.
            </p>

            {/* Table */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: 'rgba(68,73,51,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
                {['DISTANCE', 'PACE', 'SPLIT', 'CUMULATIVE'].map((h, i) => (
                  <div key={h} style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 14, color: '#c4c9ac', letterSpacing: 0.7, textTransform: 'uppercase', textAlign: 'center', padding: '12px 0', width: i === 0 ? 80 : i === 3 ? 108 : 60 }}>
                    {h}
                  </div>
                ))}
              </div>
              {rows.map(({ cp, rowPace, splitSecs, cumSecs }, i) => (
                <div key={cp.label} style={{ background: i % 2 === 1 ? 'rgba(68,73,51,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
                  <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 14, color: '#c4c9ac', letterSpacing: 0.7, textTransform: 'uppercase', textAlign: 'center', padding: '12px 0', width: 80 }}>
                    {cp.label}
                  </div>
                  <button
                    onClick={() => { setEditingRow(i); setPickerField(null) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 14, color: '#ccff00', letterSpacing: 0.7, textAlign: 'center', padding: '12px 0', width: 60 }}
                  >
                    {rowPace !== null ? fmtMS(rowPace) : '0:00'}
                  </button>
                  <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 14, color: '#c4c9ac', letterSpacing: 0.7, textAlign: 'center', padding: '12px 0', width: 60 }}>
                    {splitSecs !== null ? fmtMS(splitSecs) : '0:00'}
                  </div>
                  <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 14, color: '#c4c9ac', letterSpacing: 0.7, textAlign: 'center', padding: '12px 0', width: 108 }}>
                    {cumSecs !== null ? fmtHMS(cumSecs) : '0:00:00'}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Share / Reset */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button onClick={handleShare} style={{ background: 'none', border: '1px solid rgba(68,73,51,0.15)', borderRadius: 2, padding: '11px 1px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 40 }}>
            <img src={imgSharePP} alt="" style={{ width: 15, height: 15 }} />
            <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 14, color: '#c4c9ac', letterSpacing: 0.7, textTransform: 'uppercase' }}>SHARE</span>
          </button>
          <button onClick={handleReset} style={{ background: 'none', border: '1px solid rgba(68,73,51,0.15)', borderRadius: 2, padding: '11px 1px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 40 }}>
            <img src={imgResetPP} alt="" style={{ width: 15, height: 15 }} />
            <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: 14, color: '#c4c9ac', letterSpacing: 0.7, textTransform: 'uppercase' }}>RESET</span>
          </button>
        </div>
      </div>

      {/* ── Modals ── */}

      {/* FULL/HALF time/pace picker */}
      {pickerField && tab !== 'CUSTOMER' && (
        <TimePicker
          field={pickerField}
          initialSeconds={pickerField === 'time' ? (timeSeconds ?? 0) : (paceSeconds ?? 0)}
          onSave={secs => {
            if (pickerField === 'time') {
              setTimeSeconds(secs)
              setPaceSeconds(secs / totalKm)
            } else {
              setPaceSeconds(secs)
              setTimeSeconds(secs * totalKm)
            }
            updateTabState({ rowPaceOverrides: {} })
            setPickerField(null)
          }}
          onCancel={() => setPickerField(null)}
        />
      )}

      {/* FULL/HALF row pace editor */}
      {editingRow !== null && tab !== 'CUSTOMER' && (
        <TimePicker
          field="pace"
          initialSeconds={rowPaceOverrides[editingRow] ?? (globalPace ?? 0)}
          onSave={secs => handleRowPaceEdit(editingRow, secs)}
          onCancel={() => setEditingRow(null)}
        />
      )}

      {/* CUSTOMER: Add Split step 1 — distance */}
      {addStep === 'distance' && (
        <DistanceSheet
          title="Add Split 1/2"
          subtitle="DISTANCE"
          initialStr={pendingDistStr}
          cancelLabel="CANCEL"
          confirmLabel="NEXT"
          onCancel={() => setAddStep(null)}
          onConfirm={km => { setPendingDistStr(String(km)); setAddStep('pace') }}
        />
      )}

      {/* CUSTOMER: Add Split step 2 — pace */}
      {addStep === 'pace' && (
        <TimePicker
          field="pace"
          initialSeconds={0}
          title="Add Split 2/2"
          subtitle="PACE"
          cancelLabel="BACK"
          onSave={secs => {
            const km = parseFloat(pendingDistStr)
            if (!isNaN(km) && km > 0 && secs > 0) {
              setCustomSegments(prev => [...prev, { km, paceSeconds: secs }])
            }
            setAddStep(null)
            setPendingDistStr('')
          }}
          onCancel={() => setAddStep('distance')}
        />
      )}

      {/* CUSTOMER: Edit split distance */}
      {editDistIdx !== null && (
        <DistanceSheet
          title="Edit Split Distance"
          subtitle={splitLabel(editDistIdx)}
          initialStr={String(customSegments[editDistIdx]?.km ?? '')}
          cancelLabel="CANCEL"
          confirmLabel="SAVE"
          onCancel={() => setEditDistIdx(null)}
          onConfirm={km => {
            setCustomSegments(prev => prev.map((seg, i) => i === editDistIdx ? { ...seg, km } : seg))
            setEditDistIdx(null)
          }}
        />
      )}

      {/* CUSTOMER: Edit split pace */}
      {editPaceIdx !== null && (
        <TimePicker
          field="pace"
          initialSeconds={customSegments[editPaceIdx]?.paceSeconds ?? 0}
          title="Edit Split Pace"
          subtitle={splitLabel(editPaceIdx)}
          cancelLabel="CANCEL"
          onSave={secs => {
            setCustomSegments(prev => prev.map((seg, i) => i === editPaceIdx ? { ...seg, paceSeconds: secs } : seg))
            setEditPaceIdx(null)
          }}
          onCancel={() => setEditPaceIdx(null)}
        />
      )}

      {/* Toast */}
      <div style={{
        position: 'fixed', bottom: 40, left: '50%',
        transform: `translateX(-50%) translateY(${toastVisible ? 0 : 16}px)`,
        opacity: toastVisible ? 1 : 0, transition: 'opacity 0.2s, transform 0.2s',
        background: 'rgba(30,30,30,0.95)', border: '1px solid rgba(195,244,0,0.2)',
        borderRadius: 8, padding: '10px 20px', pointerEvents: 'none', zIndex: 100,
        maxWidth: 'calc(100vw - 48px)', textAlign: 'center',
      }}>
        <span style={{ fontFamily: "'Lexend', sans-serif", fontSize: 13, color: '#C4C9AC' }}>{toastMsg}</span>
      </div>

      {/* Share card modal */}
      {shareData && <ShareCardModal data={shareData} onClose={() => setShareData(null)} />}
    </div>
  )
}
