import { useEffect, useMemo, useRef, useState } from "react"
import TimePicker from "../components/TimePicker"

const assetPathPrefix = "/assets"
const imgBack = `${assetPathPrefix}/04f96.svg`
const imgShoeAction = `${assetPathPrefix}/4b3c2.svg`
const imgEdit = `${assetPathPrefix}/f6d99.svg`
const imgEmpty = `${assetPathPrefix}/bf247.png`
const imgStatusIcons = `${assetPathPrefix}/76cef.svg`
const imgMore = `${assetPathPrefix}/d6eab.svg`
const imgEmptyRun = `${assetPathPrefix}/29982.svg`
const imgRetired = `${assetPathPrefix}/4897f.svg`
const imgOutdoorRun = `${assetPathPrefix}/320ec.svg`
const imgIndoorRun = `${assetPathPrefix}/388ae.svg`
const imgDelete = `${assetPathPrefix}/5f369.svg`
const imgRackFilter = `${assetPathPrefix}/b170f.svg`
const imgRackAdd = `${assetPathPrefix}/e58d1.svg`
const imgRackClose = `${assetPathPrefix}/2a3e1.svg`

type ShoeStatus = "in-use" | "retired"
type RunType = "Outdoor running" | "Indoor running"

type RunRecord = {
  id: string
  type: RunType
  distanceKm: number
  durationSeconds: number
  recordedAt: string
}

type RunningShoe = {
  id: string
  name: string
  image: string
  color: string
  size: string
  status: ShoeStatus
  addedAt: string
  retiredAt?: string
  runs: RunRecord[]
}

type CatalogShoe = {
  id: string
  brand: string
  name: string
  image: string
  logo: string
}

const RUN_DISTANCE_PRESETS = [
  { label: "FULL", km: 42.195 },
  { label: "HALF", km: 21.0975 },
  { label: "10KM", km: 10 },
  { label: "5KM", km: 5 },
  { label: "1Mi", km: 1.60934 },
  { label: "1KM", km: 1 },
  { label: "800M", km: 0.8 },
  { label: "400M", km: 0.4 },
]

const BRAND_LOGOS: Record<string, string> = {
  Nike: `${assetPathPrefix}/53e60.svg`,
  ASICS: `${assetPathPrefix}/a21d7.svg`,
  Adidas: `${assetPathPrefix}/61752.svg`,
  "New Balance": `${assetPathPrefix}/e47ee.svg`,
  Brooks: `${assetPathPrefix}/f9f58.svg`,
  Saucony: `${assetPathPrefix}/9c30d.svg`,
}

const HOT_SHOES: CatalogShoe[] = [
  {
    id: "rack-nike-vomero-plus",
    brand: "Nike",
    name: "Vomero Plus",
    image: `${assetPathPrefix}/fbf59.png`,
    logo: BRAND_LOGOS.Nike,
  },
  {
    id: "rack-asics-superblast-3",
    brand: "ASICS",
    name: "Superblast 3",
    image: `${assetPathPrefix}/ed1ae.png`,
    logo: BRAND_LOGOS.ASICS,
  },
  {
    id: "rack-asics-novablast-5",
    brand: "ASICS",
    name: "Novablast 5",
    image: `${assetPathPrefix}/50e68.png`,
    logo: BRAND_LOGOS.ASICS,
  },
  {
    id: "rack-adidas-adizero-evo-sl",
    brand: "Adidas",
    name: "Adizero EVO SL",
    image: `${assetPathPrefix}/7b785.png`,
    logo: BRAND_LOGOS.Adidas,
  },
  {
    id: "rack-new-balance-fresh-foam-x",
    brand: "New Balance",
    name: "Fresh Foam X 1080",
    image: `${assetPathPrefix}/7bdfd.png`,
    logo: BRAND_LOGOS["New Balance"],
  },
  {
    id: "rack-nike-vomero-18",
    brand: "Nike",
    name: "Vomero 18",
    image: `${assetPathPrefix}/fa358.png`,
    logo: BRAND_LOGOS.Nike,
  },
  {
    id: "rack-brooks-ghost-max-3",
    brand: "Brooks",
    name: "Ghost Max 3",
    image: `${assetPathPrefix}/41375.png`,
    logo: BRAND_LOGOS.Brooks,
  },
  {
    id: "rack-saucony-endorphin-speed",
    brand: "Saucony",
    name: "Endorphin Speed",
    image: `${assetPathPrefix}/9d018.png`,
    logo: BRAND_LOGOS.Saucony,
  },
]

const NEW_BALANCE_SHOES: CatalogShoe[] = [
  ["fuelcell-rebel", "FuelCell Rebel v4", "47a1d.png"],
  ["supercomp-elite", "SuperComp Elite v5", "472f5.png"],
  ["fresh-foam-x-1080", "Fresh Foam X 1080v14", "0ddb6.png"],
  ["fresh-foam-1080", "Fresh Foam 1080", "fa980.png"],
  ["fresh-foam-x-more", "Fresh Foam X More", "7bdfd.png"],
  ["1540-v4", "1540 v4", "6b91d.png"],
  ["1080-v15", "1080v15", "8070a.png"],
  ["fresh-foam-x-kaiha", "Fresh Foam X Kaiha", "ac3cc.png"],
].map(([id, name, image]) => ({
  id: `rack-new-balance-${id}`,
  brand: "New Balance",
  name,
  image: `${assetPathPrefix}/${image}`,
  logo: BRAND_LOGOS["New Balance"],
}))

const SHOE_CATALOG = [
  ...HOT_SHOES,
  ...NEW_BALANCE_SHOES.filter(
    (shoe) => !HOT_SHOES.some((hotShoe) => hotShoe.id === shoe.id),
  ),
]

const SHOE_BRANDS = [
  "Nike",
  "Adidas",
  "On",
  "ASICS",
  "Saucony",
  "Brooks",
  "New Balance",
  "Puma",
  "Xtep",
  "Anta",
  "Lining",
  "Mizuno",
  "Hoka",
  "Under Armour",
  "BMAI",
  "Dynafish",
  "Salomon",
  "Reebok",
  "Descente",
  "Skecher",
  "Decathlon",
  "361°",
  "Qiaodan",
  "Peak",
  "Do-Win",
  "ERKE",
]

const retiredRuns: RunRecord[] = [
  {
    id: "retired-1",
    type: "Outdoor running",
    distanceKm: 7.88,
    durationSeconds: 3654,
    recordedAt: "2026-09-06T07:09:00",
  },
  {
    id: "retired-2",
    type: "Outdoor running",
    distanceKm: 10,
    durationSeconds: 3956,
    recordedAt: "2026-09-08T10:23:00",
  },
  {
    id: "retired-3",
    type: "Outdoor running",
    distanceKm: 8.08,
    durationSeconds: 3611,
    recordedAt: "2026-09-07T06:22:00",
  },
]

const INITIAL_SHOES: RunningShoe[] = [
  {
    id: "nike-vomero-plus",
    name: "Nike Vomero Plus",
    image: `${assetPathPrefix}/9b9f9.png`,
    color: "White / Green",
    size: "43",
    status: "in-use",
    addedAt: "2026-05-15T08:00:00Z",
    runs: [],
  },
  {
    id: "new-balance-rebel-v4",
    name: "New Balance Fuelcell Rebel V4",
    image: `${assetPathPrefix}/ceb2d.png`,
    color: "White / Green",
    size: "43",
    status: "in-use",
    addedAt: "2026-04-12T08:00:00Z",
    runs: [],
  },
  {
    id: "anta-c202-6",
    name: "ANTA C202 6",
    image: `${assetPathPrefix}/85aac.png`,
    color: "White / Green",
    size: "43",
    status: "in-use",
    addedAt: "2026-03-10T08:00:00Z",
    runs: [],
  },
  {
    id: "361-eleos",
    name: "361° Eleos",
    image: `${assetPathPrefix}/f5023.png`,
    color: "White / Green",
    size: "43",
    status: "in-use",
    addedAt: "2026-02-08T08:00:00Z",
    runs: [],
  },
  {
    id: "xtep-260x-2",
    name: "XTEP 260X 2.0",
    image: `${assetPathPrefix}/b4d0f.png`,
    color: "White / Green",
    size: "43",
    status: "in-use",
    addedAt: "2026-01-05T08:00:00Z",
    runs: [],
  },
  {
    id: "qiaodan-huanying-1",
    name: "Qiaodan Huanying I",
    image: `${assetPathPrefix}/010f9.png`,
    color: "White / Green",
    size: "43",
    status: "retired",
    addedAt: "2025-12-03T08:00:00Z",
    retiredAt: "2026-03-08T08:00:00Z",
    runs: retiredRuns,
  },
  {
    id: "xtep-2000km-1",
    name: "XTEP 2000KM I",
    image: `${assetPathPrefix}/f4bee.png`,
    color: "White / Green",
    size: "43",
    status: "retired",
    addedAt: "2025-10-01T08:00:00Z",
    retiredAt: "2026-02-10T08:00:00Z",
    runs: retiredRuns,
  },
]

function useCurrentTime() {
  const getTime = () => {
    const now = new Date()
    return `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`
  }
  const [time, setTime] = useState(getTime)

  useEffect(() => {
    const timer = window.setInterval(() => setTime(getTime()), 10000)
    return () => window.clearInterval(timer)
  }, [])

  return time
}

function shoeDistance(shoe: RunningShoe) {
  return shoe.runs.reduce((total, run) => total + run.distanceKm, 0)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

function formatRecordDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value))
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
}

function formatPace(seconds: number, distanceKm: number) {
  const pace = Math.round(seconds / distanceKm)
  return `${Math.floor(pace / 60)}’${String(pace % 60).padStart(2, "0")}”/KM`
}

function StatusBar({ time }: { time: string }) {
  return (
    <div className="running-shoes-status-bar" aria-hidden="true">
      <div className="running-shoes-status-side">
        <span>{time}</span>
      </div>
      <div className="running-shoes-dynamic-island" />
      <div className="running-shoes-status-side">
        <img src={imgStatusIcons} alt="" width="85.329" height="13" />
      </div>
    </div>
  )
}

function SavedToast({ visible }: { visible: boolean }) {
  return (
    <div
      className={`shoe-saved-toast${visible ? " visible" : ""}`}
      role="status"
    >
      Saved.
    </div>
  )
}

function ShoeRack({
  time,
  addedNames,
  onBack,
  onAdd,
}: {
  time: string
  addedNames: Set<string>
  onBack: () => void
  onAdd: (shoe: CatalogShoe) => void
}) {
  const [filter, setFilter] = useState("Hot")
  const [brandsOpen, setBrandsOpen] = useState(false)
  const [pendingBrand, setPendingBrand] = useState<string | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const quickFilterRef = useRef<HTMLDivElement>(null)
  const quickFilters = ["Hot", ...SHOE_BRANDS]
  const visibleCatalog =
    filter === "Hot"
      ? HOT_SHOES
      : SHOE_CATALOG.filter(
          (shoe) => shoe.brand.toLowerCase() === filter.toLowerCase(),
        )

  useEffect(() => {
    if (!toastVisible) return
    const timer = window.setTimeout(() => setToastVisible(false), 2500)
    return () => window.clearTimeout(timer)
  }, [toastVisible])

  useEffect(() => {
    const selectedTab = quickFilterRef.current?.querySelector<HTMLElement>(
      `[data-filter="${filter}"]`,
    )
    selectedTab?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    })
  }, [filter])

  const openBrandPanel = () => {
    setPendingBrand(filter === "Hot" ? null : filter)
    setBrandsOpen(true)
  }

  const closeBrandPanel = () => {
    setFilter(pendingBrand ?? "Hot")
    setBrandsOpen(false)
  }

  return (
    <main className="shoe-rack-page">
      <StatusBar time={time} />
      <header className="shoe-rack-header">
        <button onClick={onBack} aria-label="Back to running shoes">
          <img src={imgBack} alt="" width="21" height="21" />
        </button>
        <h1>Shoe Rack</h1>
      </header>
      <div className="shoe-rack-content">
        <div className="shoe-rack-filter-row">
          <div
            ref={quickFilterRef}
            className="shoe-rack-quick-filters no-scrollbar"
          >
            {quickFilters.map((brand) => (
              <button
                key={brand}
                data-filter={brand}
                className={filter === brand ? "active" : ""}
                onClick={() => setFilter(brand)}
              >
                {brand}
              </button>
            ))}
          </div>
          <button
            className="shoe-rack-filter-button"
            aria-label="Choose running shoe brand"
            onClick={openBrandPanel}
          >
            <img src={imgRackFilter} alt="" width="24" height="24" />
          </button>
        </div>

        {visibleCatalog.length ? (
          <div className="shoe-rack-grid">
            {visibleCatalog.map((shoe) => {
              const fullName = `${shoe.brand} ${shoe.name}`
              const isAdded = addedNames.has(fullName.toLowerCase())
              return (
                <article className="shoe-rack-card" key={shoe.id}>
                  <img
                    className="shoe-rack-brand-logo"
                    src={shoe.logo}
                    alt=""
                  />
                  <button
                    className="shoe-rack-add"
                    aria-label={`Add ${fullName}`}
                    disabled={isAdded}
                    onClick={() => {
                      onAdd(shoe)
                      setToastVisible(true)
                    }}
                  >
                    <img src={imgRackAdd} alt="" width="24" height="24" />
                  </button>
                  <img
                    className="shoe-rack-product"
                    src={shoe.image}
                    alt={fullName}
                  />
                  <h2>{fullName}</h2>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="shoe-rack-empty">
            <h2>No shoes available</h2>
            <p>Choose another brand to browse running shoes.</p>
          </div>
        )}
      </div>

      {brandsOpen && (
        <>
          <button
            className="shoe-rack-brand-scrim"
            aria-label="Close brand filter"
            onClick={closeBrandPanel}
          />
          <section
            className="shoe-rack-brand-panel"
            aria-label="Running shoe brands"
          >
            <header>
              <h2>Running Shoe Brands</h2>
              <button aria-label="Close brand filter" onClick={closeBrandPanel}>
                <img src={imgRackClose} alt="" width="24" height="24" />
              </button>
            </header>
            <div>
              {SHOE_BRANDS.map((brand) => (
                <button
                  key={brand}
                  className={pendingBrand === brand ? "active" : ""}
                  onClick={() => {
                    const nextBrand = pendingBrand === brand ? null : brand
                    setPendingBrand(nextBrand)
                    setFilter(nextBrand ?? "Hot")
                    setBrandsOpen(false)
                  }}
                >
                  {brand}
                </button>
              ))}
            </div>
          </section>
        </>
      )}
      <SavedToast visible={toastVisible} />
    </main>
  )
}

function SwipeShoeRow({
  shoe,
  onOpen,
  onRecord,
  onDelete,
}: {
  shoe: RunningShoe
  onOpen: () => void
  onRecord: () => void
  onDelete: () => void
}) {
  const [offset, setOffset] = useState(0)
  const dragStart = useRef(0)
  const dragOffset = useRef(0)
  const didDrag = useRef(false)

  return (
    <div className="running-shoe-swipe">
      <button
        className="running-shoe-delete-action"
        aria-label={`Delete ${shoe.name}`}
        onClick={onDelete}
      >
        <img src={imgDelete} alt="" width="24" height="24" />
      </button>
      <article
        className={`running-shoe-row${
          shoe.status === "retired" ? " retired" : ""
        }`}
        role="button"
        tabIndex={0}
        style={{ transform: `translateX(${offset}px)` }}
        onClick={() => {
          if (didDrag.current) {
            didDrag.current = false
            return
          }
          onOpen()
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onOpen()
          }
        }}
        onPointerDown={(event) => {
          if ((event.target as Element).closest("button")) return
          dragStart.current = event.clientX
          dragOffset.current = offset
          didDrag.current = false
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
          const delta = event.clientX - dragStart.current
          if (Math.abs(delta) > 6) didDrag.current = true
          setOffset(Math.min(0, Math.max(-88, dragOffset.current + delta)))
        }}
        onPointerUp={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
          event.currentTarget.releasePointerCapture(event.pointerId)
          setOffset((current) => (current < -40 ? -88 : 0))
        }}
        onPointerCancel={() => setOffset(0)}
      >
        <div className="running-shoe-image">
          <img src={shoe.image} alt={shoe.name} />
        </div>
        <div className="running-shoe-details">
          <h2>{shoe.name}</h2>
          <p>
            <span>Total</span>
            <strong>{shoe.runs.length}</strong>
            <span>times,</span>
            <strong>{shoeDistance(shoe).toFixed(2)}</strong>
            <span>KM</span>
            {shoe.status === "in-use" && (
              <button
                className="running-shoe-record-button"
                aria-label={`Record a run for ${shoe.name}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onRecord()
                }}
              >
                <img src={imgEdit} alt="" width="16" height="16" />
              </button>
            )}
          </p>
        </div>
      </article>
    </div>
  )
}

export default function RunningShoes({ onBack }: { onBack: () => void }) {
  const [status, setStatus] = useState<ShoeStatus>("in-use")
  const [shoes, setShoes] = useState(INITIAL_SHOES)
  const [rackOpen, setRackOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [listRecordShoeId, setListRecordShoeId] = useState<string | null>(null)
  const [deleteShoeId, setDeleteShoeId] = useState<string | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const currentTime = useCurrentTime()
  const selectedShoe = shoes.find((shoe) => shoe.id === selectedId)
  const listRecordShoe = shoes.find((shoe) => shoe.id === listRecordShoeId)
  const visibleShoes = useMemo(
    () =>
      shoes
        .filter((shoe) => shoe.status === status)
        .sort((a, b) => b.addedAt.localeCompare(a.addedAt)),
    [shoes, status],
  )
  const addedNames = useMemo(
    () => new Set(shoes.map((shoe) => shoe.name.toLowerCase())),
    [shoes],
  )

  useEffect(() => {
    if (!toastVisible) return
    const timer = window.setTimeout(() => setToastVisible(false), 2500)
    return () => window.clearTimeout(timer)
  }, [toastVisible])

  if (rackOpen) {
    return (
      <ShoeRack
        time={currentTime}
        addedNames={addedNames}
        onBack={() => setRackOpen(false)}
        onAdd={(catalogShoe) => {
          const name = `${catalogShoe.brand} ${catalogShoe.name}`
          setShoes((items) =>
            items.some((shoe) => shoe.name.toLowerCase() === name.toLowerCase())
              ? items
              : [
                  {
                    id: catalogShoe.id,
                    name,
                    image: catalogShoe.image,
                    color: "White / Green",
                    size: "43",
                    status: "in-use",
                    addedAt: new Date().toISOString(),
                    runs: [],
                  },
                  ...items,
                ],
          )
        }}
      />
    )
  }

  if (selectedShoe) {
    return (
      <>
        <RunningShoeDetail
          shoe={selectedShoe}
          time={currentTime}
          onBack={() => setSelectedId(null)}
          onAddRun={(run) => {
            setShoes((items) =>
              items.map((shoe) =>
                shoe.id === selectedShoe.id
                  ? { ...shoe, runs: [run, ...shoe.runs] }
                  : shoe,
              ),
            )
            setToastVisible(true)
          }}
          onDeleteRun={(runId) =>
            setShoes((items) =>
              items.map((shoe) =>
                shoe.id === selectedShoe.id
                  ? {
                      ...shoe,
                      runs: shoe.runs.filter((run) => run.id !== runId),
                    }
                  : shoe,
              ),
            )
          }
          onRetire={() => {
            setShoes((items) =>
              items.map((shoe) =>
                shoe.id === selectedShoe.id
                  ? {
                      ...shoe,
                      status: "retired",
                      retiredAt: new Date().toISOString(),
                    }
                  : shoe,
              ),
            )
          }}
          onRemove={() => {
            setShoes((items) =>
              items.filter((shoe) => shoe.id !== selectedShoe.id),
            )
            setSelectedId(null)
          }}
        />
        <SavedToast visible={toastVisible} />
      </>
    )
  }

  return (
    <main className="running-shoes-page">
      <StatusBar time={currentTime} />
      <header className="running-shoes-header">
        <div className="running-shoes-title-group">
          <button
            className="running-shoes-icon-button"
            onClick={onBack}
            aria-label="Back"
          >
            <img src={imgBack} alt="" width="21" height="21" />
          </button>
          <h1>Running Shoe</h1>
        </div>
        <button
          className="running-shoes-icon-button"
          aria-label="Add running shoe"
          onClick={() => setRackOpen(true)}
        >
          <img src={imgShoeAction} alt="" width="24" height="24" />
        </button>
      </header>

      <div className="running-shoes-content">
        <div
          className="running-shoes-tabs"
          role="tablist"
          aria-label="Running shoe status"
        >
          {(["in-use", "retired"] as ShoeStatus[]).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={status === tab}
              className={status === tab ? "active" : ""}
              onClick={() => setStatus(tab)}
            >
              {tab === "in-use" ? "In use" : "Retired"}
            </button>
          ))}
        </div>

        {visibleShoes.length ? (
          <div className="running-shoes-list">
            {visibleShoes.map((shoe) => (
              <SwipeShoeRow
                key={shoe.id}
                shoe={shoe}
                onOpen={() => setSelectedId(shoe.id)}
                onRecord={() => setListRecordShoeId(shoe.id)}
                onDelete={() => setDeleteShoeId(shoe.id)}
              />
            ))}
          </div>
        ) : (
          <section className="running-shoes-empty">
            <div className="running-shoes-empty-illustration">
              <img src={imgEmpty} alt="" />
            </div>
            <div>
              <h2>No shoes here</h2>
              <p>
                There are currently no running shoes;
                <br />
                please switch status or add a new one.
              </p>
            </div>
            <button>Add shoe</button>
          </section>
        )}
      </div>
      {listRecordShoe && (
        <ListRunRecorder
          shoe={listRecordShoe}
          onCancel={() => setListRecordShoeId(null)}
          onSave={(run) => {
            setShoes((items) =>
              items.map((shoe) =>
                shoe.id === listRecordShoe.id
                  ? { ...shoe, runs: [run, ...shoe.runs] }
                  : shoe,
              ),
            )
            setListRecordShoeId(null)
            setToastVisible(true)
          }}
        />
      )}
      {deleteShoeId && (
        <div className="shoe-overlay centered" role="presentation">
          <div className="shoe-confirm" role="alertdialog" aria-modal="true">
            <h2>Delete this shoe?</h2>
            <p>
              This shoe and its running history will be permanently removed.
            </p>
            <div>
              <button onClick={() => setDeleteShoeId(null)}>Cancel</button>
              <button
                className="danger"
                onClick={() => {
                  setShoes((items) =>
                    items.filter((shoe) => shoe.id !== deleteShoeId),
                  )
                  setDeleteShoeId(null)
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <SavedToast visible={toastVisible} />
    </main>
  )
}

function ListRunRecorder({
  shoe,
  onCancel,
  onSave,
}: {
  shoe: RunningShoe
  onCancel: () => void
  onSave: (run: RunRecord) => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [runType, setRunType] = useState<RunType>("Outdoor running")
  const [distance, setDistance] = useState("")
  const distanceValue = Number(distance)

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  const saveRun = (durationSeconds: number) => {
    if (!(distanceValue > 0) || durationSeconds <= 0) return
    onSave({
      id: `run-${Date.now()}`,
      type: runType,
      distanceKm: distanceValue,
      durationSeconds,
      recordedAt: new Date().toISOString(),
    })
  }

  if (step === 2) {
    return (
      <TimePicker
        field="time"
        initialSeconds={0}
        title="Add Running 2/2"
        subtitle="TIME"
        cancelLabel="BACK"
        onCancel={() => setStep(1)}
        onSave={saveRun}
      />
    )
  }

  return (
    <div className="shoe-overlay record" role="presentation">
      <section
        className="shoe-record-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Add running record for ${shoe.name}`}
      >
        <div className="shoe-record-handle" aria-hidden="true">
          <i />
        </div>
        <header>
          <button onClick={onCancel}>Cancel</button>
          <div>
            <h2>Add Running 1/2</h2>
            <span>Type/Distance</span>
          </div>
          <button
            className="accent"
            disabled={!(distanceValue > 0)}
            onClick={() => setStep(2)}
          >
            Next
          </button>
        </header>
        <div className="shoe-record-content">
          <div className="shoe-run-type-tabs">
            {(["Outdoor running", "Indoor running"] as RunType[]).map(
              (type) => (
                <button
                  key={type}
                  className={runType === type ? "active" : ""}
                  onClick={() => setRunType(type)}
                >
                  {type}
                </button>
              ),
            )}
          </div>
          <label>
            <span>Distance (KM)</span>
            <div>
              <input
                autoFocus
                inputMode="decimal"
                value={distance}
                onChange={(event) =>
                  setDistance(event.target.value.replace(/[^0-9.]/g, ""))
                }
              />
              <b>KM</b>
            </div>
          </label>
          <div className="shoe-distance-presets">
            {RUN_DISTANCE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                className={distanceValue === preset.km ? "active" : ""}
                onClick={() => setDistance(String(preset.km))}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function SwipeRunRecord({
  run,
  onDelete,
}: {
  run: RunRecord
  onDelete: () => void
}) {
  const [offset, setOffset] = useState(0)
  const dragStart = useRef(0)
  const dragOffset = useRef(0)

  return (
    <div className="shoe-run-swipe">
      <button
        className="shoe-run-delete-action"
        aria-label="Delete running record"
        onClick={onDelete}
      >
        <img src={imgDelete} alt="" width="24" height="24" />
      </button>
      <article
        className="shoe-run-card"
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={(event) => {
          dragStart.current = event.clientX
          dragOffset.current = offset
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
          const nextOffset = Math.min(
            0,
            Math.max(
              -88,
              dragOffset.current + event.clientX - dragStart.current,
            ),
          )
          setOffset(nextOffset)
        }}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture(event.pointerId)
          setOffset((current) => (current < -40 ? -88 : 0))
        }}
        onPointerCancel={() => setOffset(0)}
      >
        <img
          className="shoe-run-card-art"
          src={run.type === "Indoor running" ? imgIndoorRun : imgOutdoorRun}
          alt=""
          width="72"
          height="72"
        />
        <div className="shoe-run-card-top">
          <span>{run.type}</span>
          <time>{formatRecordDate(run.recordedAt)}</time>
        </div>
        <div className="shoe-run-card-stats">
          <strong>{run.distanceKm.toFixed(2)}</strong>
          <span>KM</span>
          <b>{formatDuration(run.durationSeconds)}</b>
          <b>{formatPace(run.durationSeconds, run.distanceKm)}</b>
        </div>
      </article>
    </div>
  )
}

function RunningShoeDetail({
  shoe,
  time,
  onBack,
  onAddRun,
  onDeleteRun,
  onRetire,
  onRemove,
}: {
  shoe: RunningShoe
  time: string
  onBack: () => void
  onAddRun: (run: RunRecord) => void
  onDeleteRun: (runId: string) => void
  onRetire: () => void
  onRemove: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmAction, setConfirmAction] =
    useState<"retire" | "remove" | null>(null)
  const [deleteRunId, setDeleteRunId] = useState<string | null>(null)
  const [recordStep, setRecordStep] = useState<1 | 2 | null>(null)
  const [runType, setRunType] = useState<RunType>("Outdoor running")
  const [distance, setDistance] = useState("")
  const distanceValue = Number(distance)

  useEffect(() => {
    document.body.style.overflow =
      menuOpen || confirmAction || deleteRunId || recordStep ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [menuOpen, confirmAction, deleteRunId, recordStep])

  const startRecording = () => {
    setMenuOpen(false)
    setRunType("Outdoor running")
    setDistance("")
    setRecordStep(1)
  }

  const shareShoe = async () => {
    setMenuOpen(false)
    const shareData = {
      title: shoe.name,
      text: `${shoe.name} · ${shoeDistance(shoe).toFixed(2)} KM · ${shoe.runs.length} runs`,
    }
    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined)
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareData.text).catch(() => undefined)
    }
  }

  const saveRun = (durationSeconds: number) => {
    if (!(distanceValue > 0) || durationSeconds <= 0) return
    onAddRun({
      id: `run-${Date.now()}`,
      type: runType,
      distanceKm: distanceValue,
      durationSeconds,
      recordedAt: new Date().toISOString(),
    })
    setRecordStep(null)
    setRunType("Outdoor running")
    setDistance("")
  }

  return (
    <main className="shoe-detail-page">
      <StatusBar time={time} />
      <header className="shoe-detail-header">
        <div className="shoe-detail-title-group">
          <button
            className="shoe-detail-back"
            onClick={onBack}
            aria-label="Back to running shoes"
          >
            <img src={imgBack} alt="" width="21" height="21" />
          </button>
          <div className="shoe-detail-heading">
            <h1>{shoe.name}</h1>
            <span>
              {shoe.color} ; {shoe.size}
              {shoe.status === "in-use" && (
                <img src={imgEdit} alt="" width="16" height="16" />
              )}
            </span>
          </div>
        </div>
        <div className="shoe-detail-actions">
          <button
            aria-label="Running shoe actions"
            onClick={() => setMenuOpen(true)}
          >
            <img src={imgMore} alt="" width="24" height="24" />
          </button>
        </div>
      </header>

      <div className="shoe-detail-scroll">
        <section className="shoe-summary">
          <img
            className={`shoe-summary-image${
              shoe.status === "retired" ? " retired" : ""
            }`}
            src={shoe.image}
            alt={shoe.name}
          />
          {shoe.status === "retired" && (
            <img
              className="shoe-retired-badge"
              src={imgRetired}
              alt="Retired"
            />
          )}
          <div className="shoe-total">
            <strong>{shoeDistance(shoe).toFixed(2)}</strong>
            <span>KM</span>
          </div>
          <div className="shoe-run-count">
            <strong>{shoe.runs.length}</strong>
            <span>Times</span>
            {shoe.status === "in-use" && (
              <button
                className="shoe-record-edit"
                aria-label="Record a run"
                onClick={startRecording}
              >
                <img src={imgEdit} alt="" width="16" height="16" />
              </button>
            )}
          </div>
          <p>
            Date {shoe.status === "retired" ? "Retired" : "Added"}:{" "}
            {formatDate(shoe.retiredAt ?? shoe.addedAt)}
          </p>
        </section>

        <section className="shoe-running-details">
          <div className="shoe-section-title">
            <span>Running Details</span>
            <i />
          </div>
          {shoe.runs.length ? (
            <div className="shoe-run-list">
              {shoe.runs.map((run) => (
                <SwipeRunRecord
                  key={run.id}
                  run={run}
                  onDelete={() => setDeleteRunId(run.id)}
                />
              ))}
            </div>
          ) : (
            <div className="shoe-runs-empty">
              <div>
                <img src={imgEmptyRun} alt="" width="72" height="72" />
              </div>
              <h2>No runs recorded yet</h2>
              <p>
                Your first outdoor or indoor run will appear here once it’s
                synced or Recorded.
              </p>
              <button onClick={startRecording}>Record a Run</button>
            </div>
          )}
        </section>
      </div>

      {menuOpen && (
        <div
          className="shoe-overlay"
          role="presentation"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="shoe-action-sheet"
            role="dialog"
            aria-label="Running shoe actions"
            onClick={(event) => event.stopPropagation()}
          >
            {shoe.status === "in-use" && (
              <button className="accent" onClick={startRecording}>
                Record a Run
              </button>
            )}
            <button onClick={shareShoe}>Share</button>
            {shoe.status === "in-use" && (
              <button
                onClick={() => {
                  setMenuOpen(false)
                  setConfirmAction("retire")
                }}
              >
                Retire
              </button>
            )}
            <button
              className="danger"
              onClick={() => {
                setMenuOpen(false)
                setConfirmAction("remove")
              }}
            >
              Remove
            </button>
            <button className="cancel" onClick={() => setMenuOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="shoe-overlay centered" role="presentation">
          <div className="shoe-confirm" role="alertdialog" aria-modal="true">
            <h2>
              {confirmAction === "retire"
                ? "Retire this shoe?"
                : "Remove this shoe?"}
            </h2>
            <p>
              {confirmAction === "retire"
                ? "This shoe will move to your retired list. Its running history will be kept."
                : "This shoe and its running history will be permanently removed."}
            </p>
            <div>
              <button onClick={() => setConfirmAction(null)}>Cancel</button>
              <button
                className={confirmAction === "remove" ? "danger" : "accent"}
                onClick={() => {
                  if (confirmAction === "retire") onRetire()
                  else onRemove()
                  setConfirmAction(null)
                }}
              >
                {confirmAction === "retire" ? "Retire" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteRunId && (
        <div className="shoe-overlay centered" role="presentation">
          <div className="shoe-confirm" role="alertdialog" aria-modal="true">
            <h2>Delete this run?</h2>
            <p>This running record will be permanently removed.</p>
            <div>
              <button onClick={() => setDeleteRunId(null)}>Cancel</button>
              <button
                className="danger"
                onClick={() => {
                  onDeleteRun(deleteRunId)
                  setDeleteRunId(null)
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {recordStep === 1 && (
        <div className="shoe-overlay record" role="presentation">
          <section
            className="shoe-record-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Add Running 1/2"
          >
            <div className="shoe-record-handle" aria-hidden="true">
              <i />
            </div>
            <header>
              <button onClick={() => setRecordStep(null)}>Cancel</button>
              <div>
                <h2>Add Running 1/2</h2>
                <span>Type/Distance</span>
              </div>
              <button
                className="accent"
                disabled={!(distanceValue > 0)}
                onClick={() => setRecordStep(2)}
              >
                Next
              </button>
            </header>
            <div className="shoe-record-content">
              <div className="shoe-run-type-tabs">
                {(["Outdoor running", "Indoor running"] as RunType[]).map(
                  (type) => (
                    <button
                      key={type}
                      className={runType === type ? "active" : ""}
                      onClick={() => setRunType(type)}
                    >
                      {type}
                    </button>
                  ),
                )}
              </div>
              <label>
                <span>Distance (KM)</span>
                <div>
                  <input
                    autoFocus
                    inputMode="decimal"
                    value={distance}
                    onChange={(event) =>
                      setDistance(event.target.value.replace(/[^0-9.]/g, ""))
                    }
                  />
                  <b>KM</b>
                </div>
              </label>
              <div className="shoe-distance-presets">
                {RUN_DISTANCE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    className={distanceValue === preset.km ? "active" : ""}
                    onClick={() => setDistance(String(preset.km))}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
      {recordStep === 2 && (
        <TimePicker
          field="time"
          initialSeconds={0}
          title="Add Running 2/2"
          subtitle="TIME"
          cancelLabel="BACK"
          onCancel={() => setRecordStep(1)}
          onSave={saveRun}
        />
      )}
    </main>
  )
}
