import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fetchKakaoJson, getKakaoRestApiKey } from './_lib/kakao'

type KakaoDoc = {
  y?: string
  x?: string
  address_name?: string
  place_name?: string
}

type KakaoSearchResponse = {
  documents?: KakaoDoc[]
}

function firstCoords(data: unknown): {
  lat: number
  lng: number
  addressName: string
} | null {
  const docs = (data as KakaoSearchResponse | null)?.documents
  if (!Array.isArray(docs) || docs.length === 0) return null
  const doc = docs[0]
  const lat = Number(doc.y)
  const lng = Number(doc.x)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const addressName = (doc.address_name || doc.place_name || '').trim()
  return { lat, lng, addressName }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' })
  }

  const apiKey = getKakaoRestApiKey()
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: 'SERVER_MISCONFIGURED' })
  }

  const raw = typeof req.query.address === 'string' ? req.query.address : ''
  const address = raw.trim()
  if (!address) {
    return res.status(400).json({ ok: false, error: 'ADDRESS_REQUIRED' })
  }
  if (address.length > 200) {
    return res.status(400).json({ ok: false, error: 'ADDRESS_TOO_LONG' })
  }

  try {
    const addressUrl =
      'https://dapi.kakao.com/v2/local/search/address.json?' +
      new URLSearchParams({ query: address, size: '1' }).toString()
    const addressResult = await fetchKakaoJson(addressUrl, apiKey)
    if (!addressResult.ok) {
      return res.status(502).json({ ok: false, error: 'GEOCODE_UPSTREAM_ERROR' })
    }

    let coords = firstCoords(addressResult.data)

    if (!coords) {
      const keywordUrl =
        'https://dapi.kakao.com/v2/local/search/keyword.json?' +
        new URLSearchParams({ query: address, size: '1' }).toString()
      const keywordResult = await fetchKakaoJson(keywordUrl, apiKey)
      if (!keywordResult.ok) {
        return res.status(502).json({ ok: false, error: 'GEOCODE_UPSTREAM_ERROR' })
      }
      coords = firstCoords(keywordResult.data)
    }

    if (!coords) {
      return res.status(404).json({ ok: false, error: 'ADDRESS_NOT_FOUND' })
    }

    return res.status(200).json({
      ok: true,
      lat: coords.lat,
      lng: coords.lng,
      addressName: coords.addressName || address,
    })
  } catch {
    return res.status(502).json({ ok: false, error: 'GEOCODE_FAILED' })
  }
}
