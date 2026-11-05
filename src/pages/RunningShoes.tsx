import { useEffect, useMemo, useRef, useState } from "react"
import TimePicker from "../components/TimePicker"
import {
  CDN,
  type CatalogColor,
  type CatalogShoe,
  useShoeRackCatalog,
} from "../data/shoeRackCatalog"

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
const imgRecognize = `${assetPathPrefix}/b48e4.svg`
const imgCameraFrame = `${assetPathPrefix}/db0e1.svg`
const imgShoeGuide = `${assetPathPrefix}/0c30d.svg`
const imgFlash = `${assetPathPrefix}/24380.svg`
const imgCamera = `${assetPathPrefix}/69737.svg`
const imgGallery = `${assetPathPrefix}/39edd.svg`

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
  catalogId?: string
  colorId?: string
  name: string
  image: string
  color: string
  status: ShoeStatus
  addedAt: string
  retiredAt?: string
  runs: RunRecord[]
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

function StatusBar({
  time,
  transparent = false,
}: {
  time: string
  transparent?: boolean
}) {
  return (
    <div
      className={`running-shoes-status-bar${transparent ? " transparent" : ""}`}
      aria-hidden="true"
    >
      <div className="running-shoes-status-side">
        <span>{time}</span>
      </div>
      <div className="running-shoes-dynamic-island" />
      <div className="running-shoes-status-side">
        <img
          src={imgStatusIcons}
          alt=""
          width="85.329"
          height="13"
          loading="lazy"
        />
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
      Saved
    </div>
  )
}

function ShoeRack({
  time,
  catalog,
  catalogLoading,
  catalogError,
  addedColorKeys,
  onBack,
  onAdd,
  onRetry,
}: {
  time: string
  catalog: CatalogShoe[]
  catalogLoading: boolean
  catalogError: boolean
  addedColorKeys: Set<string>
  onBack: () => void
  onAdd: (shoe: CatalogShoe, color: CatalogColor) => void
  onRetry: () => void
}) {
  const [filter, setFilter] = useState("Hot")
  const [brandsOpen, setBrandsOpen] = useState(false)
  const [pendingBrand, setPendingBrand] = useState<string | null>(null)
  const [recognitionOpen, setRecognitionOpen] = useState(false)
  const [manualShoe, setManualShoe] = useState<CatalogShoe | null>(null)
  const [manualRequiresColor, setManualRequiresColor] = useState(false)
  const quickFilterRef = useRef<HTMLDivElement>(null)
  const brands = useMemo(
    () => Array.from(new Set(catalog.map((shoe) => shoe.brand))),
    [catalog],
  )
  const quickFilters = ["Hot", ...brands]
  const visibleCatalog =
    filter === "Hot"
      ? catalog.filter((shoe) => shoe.hot)
      : catalog.filter(
          (shoe) => shoe.brand.toLowerCase() === filter.toLowerCase(),
        )

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

  if (recognitionOpen) {
    return (
      <ShoeRecognition
        time={time}
        catalog={catalog}
        onBack={() => setRecognitionOpen(false)}
        onConfirm={(shoe) => {
          setRecognitionOpen(false)
          const colors = shoe.colors
          if (colors.length === 1) {
            onAdd(shoe, colors[0])
          } else {
            setManualRequiresColor(true)
            setManualShoe(shoe)
          }
        }}
      />
    )
  }

  return (
    <main className="shoe-rack-page">
      <StatusBar time={time} />
      <header className="shoe-rack-header">
        <button onClick={onBack} aria-label="Back to running shoes">
          <img src={imgBack} alt="" width="21" height="21" loading="lazy" />
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
            <img
              src={imgRackFilter}
              alt=""
              width="24"
              height="24"
              loading="lazy"
            />
          </button>
        </div>

        {catalogLoading ? (
          <div className="shoe-rack-empty">
            <h2>Loading...</h2>
            <p>Loading shoe catalog</p>
          </div>
        ) : catalogError ? (
          <div className="shoe-rack-empty">
            <h2>Couldn't load shoe catalog</h2>
            <button onClick={onRetry}>Retry</button>
          </div>
        ) : visibleCatalog.length ? (
          <div className="shoe-rack-grid">
            {visibleCatalog.map((shoe) => {
              const fullName = `${shoe.brand} ${shoe.name}`
              const colors = shoe.colors
              const allColorsAdded = colors.every((color) =>
                addedColorKeys.has(`${shoe.id}:${color.image}`),
              )
              return (
                <article className="shoe-rack-card" key={shoe.id}>
                  {shoe.logo && (
                    <img
                      className="shoe-rack-brand-logo"
                      src={`${CDN}${shoe.logo}`}
                      alt=""
                      loading="lazy"
                    />
                  )}
                  <button
                    className="shoe-rack-add"
                    aria-label={`Add ${fullName}`}
                    disabled={allColorsAdded}
                    onClick={() => {
                      if (colors.length === 1) {
                        onAdd(shoe, colors[0])
                      } else {
                        setManualRequiresColor(false)
                        setManualShoe(shoe)
                      }
                    }}
                  >
                    <img
                      src={imgRackAdd}
                      alt=""
                      width="24"
                      height="24"
                      loading="lazy"
                    />
                  </button>
                  <img
                    className="shoe-rack-product"
                    src={`${CDN}${shoe.image}`}
                    alt={fullName}
                    loading="lazy"
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

      <button
        className="shoe-rack-recognize"
        aria-label="Identify running shoe with camera"
        onClick={() => setRecognitionOpen(true)}
      >
        <img src={imgRecognize} alt="" width="32" height="32" loading="lazy" />
      </button>

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
                <img
                  src={imgRackClose}
                  alt=""
                  width="24"
                  height="24"
                  loading="lazy"
                />
              </button>
            </header>
            <div>
              {brands.map((brand) => (
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
      {manualShoe && (
        <ManualAddShoe
          shoe={manualShoe}
          addedColorKeys={addedColorKeys}
          requireColorSelection={manualRequiresColor}
          onCancel={() => setManualShoe(null)}
          onSave={(color) => {
            onAdd(manualShoe, color)
            setManualShoe(null)
          }}
        />
      )}
    </main>
  )
}

function ShoeRecognition({
  time,
  catalog,
  onBack,
  onConfirm,
}: {
  time: string
  catalog: CatalogShoe[]
  onBack: () => void
  onConfirm: (shoe: CatalogShoe) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState("")
  const [cameraLoading, setCameraLoading] = useState(true)
  const candidates = catalog.slice(0, 2)

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const startCamera = async () => {
    stopCamera()
    setCameraError("")
    setCameraLoading(true)
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not available on this device.")
      setCameraLoading(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      setCameraError(
        "Camera permission was denied or the camera is unavailable. Allow access and try again.",
      )
    } finally {
      setCameraLoading(false)
    }
  }

  useEffect(() => {
    void startCamera()
    return stopCamera
  }, [])

  const capturePhoto = () => {
    const video = videoRef.current
    if (!video?.videoWidth || !video.videoHeight) {
      setCameraError("The camera is not ready yet. Please try again.")
      return
    }
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d")?.drawImage(video, 0, 0)
    setPhoto(canvas.toDataURL("image/jpeg", 0.88))
    stopCamera()
  }

  const usePhoto = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setPhoto(typeof reader.result === "string" ? reader.result : null)
      stopCamera()
    }
    reader.readAsDataURL(file)
  }

  if (photo) {
    return (
      <main className="shoe-identify-page">
        <StatusBar time={time} transparent />
        <header className="shoe-identify-header">
          <button
            onClick={() => {
              setPhoto(null)
              void startCamera()
            }}
            aria-label="Retake shoe photo"
          >
            <img src={imgBack} alt="" width="21" height="21" loading="lazy" />
          </button>
          <h1>Identify</h1>
        </header>
        <section className="shoe-identify-results">
          <p>Similar running shoes identified, please make a selection.</p>
          <div>
            {candidates.map((shoe) => (
              <article key={shoe.id}>
                <img
                  src={`${CDN}${shoe.image}`}
                  alt={`${shoe.brand} ${shoe.name}`}
                  loading="lazy"
                />
                <h2>
                  {shoe.brand}
                  <br />
                  {shoe.name}
                </h2>
                <button
                  aria-label={`Confirm ${shoe.brand} ${shoe.name}`}
                  onClick={() => onConfirm(shoe)}
                >
                  <img
                    src={imgRackAdd}
                    alt=""
                    width="24"
                    height="24"
                    loading="lazy"
                  />
                </button>
              </article>
            ))}
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="shoe-identify-page camera">
      <StatusBar time={time} transparent />
      <header className="shoe-identify-header">
        <button onClick={onBack} aria-label="Back to shoe rack">
          <img src={imgBack} alt="" width="21" height="21" loading="lazy" />
        </button>
        <h1>Identify Shoe</h1>
      </header>
      <section className="shoe-camera-view" aria-label="Camera preview">
        <video ref={videoRef} autoPlay muted playsInline />
        <img
          className="shoe-camera-frame"
          src={imgCameraFrame}
          alt=""
          loading="lazy"
        />
        {!cameraError && (
          <img
            className="shoe-camera-guide"
            src={imgShoeGuide}
            alt=""
            loading="lazy"
          />
        )}
        {cameraLoading && <p>Starting camera…</p>}
        {cameraError && (
          <div className="shoe-camera-error">
            <p>{cameraError}</p>
            <button onClick={() => void startCamera()}>Try again</button>
          </div>
        )}
      </section>
      <div className="shoe-camera-actions">
        <button disabled aria-label="Flash is unavailable">
          <img src={imgFlash} alt="" width="32" height="32" loading="lazy" />
        </button>
        <button
          className="capture"
          onClick={capturePhoto}
          disabled={cameraLoading || Boolean(cameraError)}
          aria-label="Take photo"
        >
          <img src={imgCamera} alt="" width="40" height="40" loading="lazy" />
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          aria-label="Choose a shoe photo"
        >
          <img src={imgGallery} alt="" width="32" height="32" loading="lazy" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => usePhoto(event.target.files?.[0])}
        />
      </div>
      <p className="shoe-camera-tip">
        Tip: Please take a photo of the side of the running shoe, ensuring the
        background is clean and free of clutter.
      </p>
    </main>
  )
}

function ManualAddShoe({
  shoe,
  addedColorKeys,
  requireColorSelection = false,
  onCancel,
  onSave,
}: {
  shoe: CatalogShoe
  addedColorKeys: Set<string>
  requireColorSelection?: boolean
  onCancel: () => void
  onSave: (color: CatalogColor) => void
}) {
  const colors = shoe.colors
  const firstAvailableColor = colors.find(
    (color) => !addedColorKeys.has(`${shoe.id}:${color.image}`),
  )
  const [selectedColorId, setSelectedColorId] = useState(
    requireColorSelection ? "" : (firstAvailableColor?.image ?? ""),
  )
  const selectedColor = colors.find((color) => color.image === selectedColorId)
  const fullName = `${shoe.brand} ${shoe.name}`

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  return (
    <div className="shoe-manual-overlay" role="presentation" onClick={onCancel}>
      <section
        className="shoe-manual-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Add ${fullName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <button onClick={onCancel}>Cancel</button>
          <h2>Add Shoe</h2>
          <button
            className="save"
            disabled={!selectedColor}
            onClick={() => selectedColor && onSave(selectedColor)}
          >
            Save
          </button>
        </header>
        <div className="shoe-manual-preview">
          <img
            src={`${CDN}${selectedColor?.image ?? shoe.image}`}
            alt={fullName}
            loading="lazy"
          />
        </div>
        <div className="shoe-manual-info">
          <h3>{fullName}</h3>
          <div className="shoe-manual-tags">
            {shoe.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
        <div className="shoe-manual-colors">
          <p>
            <span>Selected Colors:</span>
            <strong>{selectedColor?.name ?? "None"}</strong>
          </p>
          <div className="no-scrollbar">
            {colors.map((color) => {
              const isAdded = addedColorKeys.has(`${shoe.id}:${color.image}`)
              return (
                <button
                  key={color.image}
                  className={selectedColorId === color.image ? "active" : ""}
                  disabled={isAdded}
                  aria-label={`${color.name}${isAdded ? " already added" : ""}`}
                  onClick={() => setSelectedColorId(color.image)}
                >
                  <img src={`${CDN}${color.image}`} alt="" loading="lazy" />
                </button>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

function EditShoeColor({
  shoe,
  catalogShoe,
  usedColorKeys,
  onCancel,
  onSave,
}: {
  shoe: RunningShoe
  catalogShoe?: CatalogShoe
  usedColorKeys: Set<string>
  onCancel: () => void
  onSave: (catalogShoe: CatalogShoe | undefined, color: CatalogColor) => void
}) {
  const colors = catalogShoe?.colors?.length
    ? catalogShoe.colors
    : [
        {
          name: shoe.color,
          image: shoe.image,
        },
      ]
  const currentColor =
    colors.find((color) => color.image === shoe.colorId) ??
    colors.find(
      (color) => color.name.toLowerCase() === shoe.color.toLowerCase(),
    ) ??
    colors[0]
  const [selectedColorId, setSelectedColorId] = useState(currentColor.image)
  const selectedColor = colors.find((color) => color.image === selectedColorId)

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  return (
    <div
      className="shoe-color-edit-overlay"
      role="presentation"
      onClick={onCancel}
    >
      <section
        className="shoe-color-edit-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Edit color for ${shoe.name}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <button onClick={onCancel}>Cancel</button>
          <h2>Edit Color</h2>
          <button
            className="save"
            disabled={!selectedColor}
            onClick={() => selectedColor && onSave(catalogShoe, selectedColor)}
          >
            Save
          </button>
        </header>
        <div className="shoe-color-edit-preview">
          <img
            src={
              catalogShoe
                ? `${CDN}${selectedColor?.image ?? catalogShoe.image}`
                : (selectedColor?.image ?? shoe.image)
            }
            alt={`${shoe.name} ${selectedColor?.name ?? shoe.color}`}
            loading="lazy"
          />
          <h3>{shoe.name}</h3>
          <p>{selectedColor?.name ?? shoe.color}</p>
        </div>
        <div className="shoe-color-edit-options no-scrollbar">
          {colors.map((color) => {
            const colorKey = catalogShoe
              ? `${catalogShoe.id}:${color.image}`
              : ""
            const isCurrent = color.image === currentColor.image
            const isUsed =
              Boolean(colorKey) && usedColorKeys.has(colorKey) && !isCurrent
            return (
              <button
                key={color.image}
                className={selectedColorId === color.image ? "active" : ""}
                disabled={isUsed}
                aria-label={`${color.name}${
                  isCurrent ? ", current color" : ""
                }${isUsed ? ", already used" : ""}`}
                onClick={() => setSelectedColorId(color.image)}
              >
                <img
                  src={catalogShoe ? `${CDN}${color.image}` : color.image}
                  alt=""
                  loading="lazy"
                />
                <span>{color.name}</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
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
        <img src={imgDelete} alt="" width="24" height="24" loading="lazy" />
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
          <img src={shoe.image} alt={shoe.name} loading="lazy" />
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
                <img
                  src={imgEdit}
                  alt=""
                  width="16"
                  height="16"
                  loading="lazy"
                />
              </button>
            )}
          </p>
        </div>
      </article>
    </div>
  )
}

export default function RunningShoes({ onBack }: { onBack: () => void }) {
  const {
    catalog,
    loading: catalogLoading,
    error: catalogError,
    retry: retryCatalog,
  } = useShoeRackCatalog()
  const [status, setStatus] = useState<ShoeStatus>("in-use")
  const [shoes, setShoes] = useState<RunningShoe[]>([])
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
  const addedColorKeys = useMemo(
    () =>
      new Set(
        shoes.flatMap((shoe) =>
          shoe.catalogId && shoe.colorId
            ? [`${shoe.catalogId}:${shoe.colorId}`]
            : [],
        ),
      ),
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
        catalog={catalog}
        catalogLoading={catalogLoading}
        catalogError={catalogError}
        addedColorKeys={addedColorKeys}
        onBack={() => setRackOpen(false)}
        onRetry={retryCatalog}
        onAdd={(catalogShoe, color) => {
          const name = `${catalogShoe.brand} ${catalogShoe.name}`
          const colorKey = `${catalogShoe.id}:${color.image}`
          setShoes((items) =>
            items.some(
              (shoe) => `${shoe.catalogId}:${shoe.colorId}` === colorKey,
            )
              ? items
              : [
                  {
                    id: `${catalogShoe.id}-${color.image}`,
                    catalogId: catalogShoe.id,
                    colorId: color.image,
                    name,
                    image: `${CDN}${color.image}`,
                    color: color.name,
                    status: "in-use",
                    addedAt: new Date().toISOString(),
                    runs: [],
                  },
                  ...items,
                ],
          )
          setRackOpen(false)
          setStatus("in-use")
          setToastVisible(true)
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
          catalog={catalog}
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
          usedColorKeys={addedColorKeys}
          onChangeColor={(catalogShoe, color) => {
            setShoes((items) =>
              items.map((shoe) =>
                shoe.id === selectedShoe.id
                  ? {
                      ...shoe,
                      catalogId: catalogShoe?.id ?? shoe.catalogId,
                      colorId: color.image,
                      color: color.name,
                      image: catalogShoe ? `${CDN}${color.image}` : color.image,
                    }
                  : shoe,
              ),
            )
            setToastVisible(true)
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
            <img src={imgBack} alt="" width="21" height="21" loading="lazy" />
          </button>
          <h1>Running Shoe</h1>
        </div>
        <button
          className="running-shoes-icon-button"
          aria-label="Add running shoe"
          onClick={() => setRackOpen(true)}
        >
          <img
            src={imgShoeAction}
            alt=""
            width="24"
            height="24"
            loading="lazy"
          />
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
              <img src={imgEmpty} alt="" loading="lazy" />
            </div>
            <div>
              <h2>No shoes here</h2>
              <p>
                There are currently no running shoes;
                <br />
                please switch status or add a new one.
              </p>
            </div>
            <button onClick={() => setRackOpen(true)}>Add shoe</button>
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
        <img src={imgDelete} alt="" width="24" height="24" loading="lazy" />
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
          loading="lazy"
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
  catalog,
  onBack,
  onAddRun,
  onDeleteRun,
  onRetire,
  onRemove,
  usedColorKeys,
  onChangeColor,
}: {
  shoe: RunningShoe
  time: string
  catalog: CatalogShoe[]
  onBack: () => void
  onAddRun: (run: RunRecord) => void
  onDeleteRun: (runId: string) => void
  onRetire: () => void
  onRemove: () => void
  usedColorKeys: Set<string>
  onChangeColor: (
    catalogShoe: CatalogShoe | undefined,
    color: CatalogColor,
  ) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmAction, setConfirmAction] =
    useState<"retire" | "remove" | null>(null)
  const [deleteRunId, setDeleteRunId] = useState<string | null>(null)
  const [recordStep, setRecordStep] = useState<1 | 2 | null>(null)
  const [colorEditOpen, setColorEditOpen] = useState(false)
  const [runType, setRunType] = useState<RunType>("Outdoor running")
  const [distance, setDistance] = useState("")
  const distanceValue = Number(distance)

  useEffect(() => {
    document.body.style.overflow =
      menuOpen || confirmAction || deleteRunId || recordStep || colorEditOpen
        ? "hidden"
        : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [menuOpen, confirmAction, deleteRunId, recordStep, colorEditOpen])

  const catalogShoe = catalog.find(
    (item) =>
      item.id === shoe.catalogId ||
      `${item.brand} ${item.name}`.toLowerCase() === shoe.name.toLowerCase(),
  )

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
            <img src={imgBack} alt="" width="21" height="21" loading="lazy" />
          </button>
          <div className="shoe-detail-heading">
            <h1>{shoe.name}</h1>
            <button
              className="shoe-detail-color-edit"
              disabled={shoe.status !== "in-use"}
              onClick={() => setColorEditOpen(true)}
              aria-label={`Edit color, current color ${shoe.color}`}
            >
              {shoe.color}
              {shoe.status === "in-use" && (
                <img
                  src={imgEdit}
                  alt=""
                  width="16"
                  height="16"
                  loading="lazy"
                />
              )}
            </button>
          </div>
        </div>
        <div className="shoe-detail-actions">
          <button
            aria-label="Running shoe actions"
            onClick={() => setMenuOpen(true)}
          >
            <img src={imgMore} alt="" width="24" height="24" loading="lazy" />
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
            loading="lazy"
          />
          {shoe.status === "retired" && (
            <img
              className="shoe-retired-badge"
              src={imgRetired}
              alt="Retired"
              loading="lazy"
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
                <img
                  src={imgEdit}
                  alt=""
                  width="16"
                  height="16"
                  loading="lazy"
                />
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
                <img
                  src={imgEmptyRun}
                  alt=""
                  width="72"
                  height="72"
                  loading="lazy"
                />
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
      {colorEditOpen && (
        <EditShoeColor
          shoe={shoe}
          catalogShoe={catalogShoe}
          usedColorKeys={usedColorKeys}
          onCancel={() => setColorEditOpen(false)}
          onSave={(nextCatalogShoe, color) => {
            onChangeColor(nextCatalogShoe, color)
            setColorEditOpen(false)
          }}
        />
      )}

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
