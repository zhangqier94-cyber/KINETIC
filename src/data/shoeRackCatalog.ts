import { useCallback, useEffect, useState } from "react"

export type CatalogColor = { name: string image: string }

export type CatalogShoe = {
  id: string
  brand: string
  brandCn: string
  logo: string
  name: string
  tags: string[]
  type: string
  image: string
  colors: CatalogColor[]
  hot?: boolean
}

export const CDN = "https://zhangqier94-cyber.github.io/KINETIC"

export function useShoeRackCatalog() {
  const [catalog, setCatalog] = useState<CatalogShoe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [requestId, setRequestId] = useState(0)

  const retry = useCallback(() => {
    setRequestId((current) => current + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    setLoading(true)
    setError(false)
    fetch(`${CDN}/shoe-catalog.json`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Catalog request failed: ${response.status}`)
        }
        return response.json() as Promise<CatalogShoe[]>
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("Invalid shoe catalog")
        }
        setCatalog(data)
        setLoading(false)
      })
      .catch((fetchError: unknown) => {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          return
        }
        setCatalog([])
        setLoading(false)
        setError(true)
      })

    return () => controller.abort()
  }, [requestId])

  return { catalog, loading, error, retry }
}
