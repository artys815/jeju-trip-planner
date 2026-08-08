import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fetchKakaoJson, getKakaoRestApiKey } from './_lib/kakao'

type KakaoRouteResponse = {
  routes?: Array<{
    result_code?: number
    summary?: {
      duration?: number
      distance?: number
    }
  }>
}

function parseCoord(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const num = Number(value)
  if (!Number.isFinite(num) || num < min || num > max) return null
  return num
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

  const originLat = parseCoord(req.query.originLat, -90, 90)
  const originLng = parseCoord(req.query.originLng, -180, 180)
  const destLat = parseCoord(req.query.destLat, -90, 90)
  const destLng = parseCoord(req.query.destLng, -180, 180)

  if (
    originLat === null ||
    originLng === null ||
    destLat === null ||
    destLng === null
  ) {
    return res.status(400).json({ ok: false, error: 'INVALID_COORDINATES' })
  }

  try {
    // Kakao Mobility uses x=longitude, y=latitude
    const params = new URLSearchParams({
      origin: `${originLng},${originLat}`,
      destination: `${destLng},${destLat}`,
      priority: 'RECOMMEND',
      summary: 'true',
      alternatives: 'false',
      road_details: 'false',
    })

    const url = `https://apis-navi.kakaomobility.com/v1/directions?${params.toString()}`
    const result = await fetchKakaoJson(url, apiKey)
    if (!result.ok) {
      return res.status(502).json({ ok: false, error: 'ROUTE_UPSTREAM_ERROR' })
    }

    const routes = (result.data as KakaoRouteResponse | null)?.routes
    const route = Array.isArray(routes) ? routes[0] : null
    if (!route || route.result_code !== 0 || !route.summary) {
      return res.status(502).json({ ok: false, error: 'ROUTE_NOT_FOUND' })
    }

    const durationSeconds = Number(route.summary.duration)
    const distanceMeters = Number(route.summary.distance)
    if (!Number.isFinite(durationSeconds) || !Number.isFinite(distanceMeters)) {
      return res.status(502).json({ ok: false, error: 'ROUTE_INVALID' })
    }

    return res.status(200).json({
      ok: true,
      durationSeconds,
      distanceMeters,
    })
  } catch {
    return res.status(502).json({ ok: false, error: 'ROUTE_FAILED' })
  }
}
