import { useCallback, useEffect, useRef, useState } from 'react'
import type { ItineraryItem } from '../types'
import {
  arrivalStatusMessage,
  formatClockMinutes,
  formatDistanceKm,
  formatEtaMinutes,
  getArrivalStatus,
  getRecommendedDepartureMinutes,
  type ArrivalStatus,
} from '../utils/eta'
import { getCachedGeocode, setCachedGeocode } from '../utils/geocodeCache'
import { parseTimeToMinutes } from '../utils/liveStatus'
import { getMapDestination } from '../utils/maps'

const REFRESH_MS = 5 * 60 * 1000

export type LiveAssistErrorCode =
  | 'UNSUPPORTED'
  | 'PERMISSION_DENIED'
  | 'TIMEOUT'
  | 'POSITION_UNAVAILABLE'
  | 'NO_NEXT'
  | 'NO_DESTINATION'
  | 'GEOCODE_FAILED'
  | 'ROUTE_FAILED'
  | 'SERVER_MISCONFIGURED'
  | 'UNKNOWN'

export interface LiveAssistSnapshot {
  etaMinutes: number
  distanceLabel: string
  recommendedDepartureLabel: string
  status: ArrivalStatus
  statusMessage: string
  directionsUrl: string
  fetchedAt: number
}

function errorMessage(code: LiveAssistErrorCode): string {
  switch (code) {
    case 'UNSUPPORTED':
      return '이 기기에서는 현재 위치를 사용할 수 없습니다.'
    case 'PERMISSION_DENIED':
      return '위치 권한이 꺼져 있어 이동시간을 계산할 수 없습니다.'
    case 'TIMEOUT':
    case 'POSITION_UNAVAILABLE':
      return '현재 위치를 가져오지 못했습니다. 다시 시도해 주세요.'
    case 'NO_NEXT':
      return '오늘의 마지막 일정입니다.'
    case 'NO_DESTINATION':
      return '다음 일정의 위치 정보가 필요합니다.'
    case 'GEOCODE_FAILED':
      return '목적지 위치를 확인하지 못했습니다.'
    case 'ROUTE_FAILED':
      return '현재 이동시간을 불러오지 못했습니다.'
    case 'SERVER_MISCONFIGURED':
      return '이동시간 서비스가 아직 설정되지 않았습니다.'
    default:
      return '이동시간을 계산하지 못했습니다. 다시 시도해 주세요.'
  }
}

async function geocodeDestination(query: string): Promise<{
  lat: number
  lng: number
  addressName?: string
} | null> {
  const cached = getCachedGeocode(query)
  if (cached) return cached

  const url = `/api/geocode?${new URLSearchParams({ address: query }).toString()}`
  const res = await fetch(url)
  const data: unknown = await res.json().catch(() => null)
  if (!res.ok || !data || typeof data !== 'object') return null
  const body = data as Record<string, unknown>
  if (body.ok !== true) return null
  const lat = Number(body.lat)
  const lng = Number(body.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const addressName =
    typeof body.addressName === 'string' ? body.addressName : undefined
  return setCachedGeocode(query, lat, lng, addressName)
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(Object.assign(new Error('UNSUPPORTED'), { code: -1 }))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12_000,
      maximumAge: 60_000,
    })
  })
}

export function useLiveTravelAssistant(
  nextItem: ItineraryItem | null,
  now: Date,
) {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorCode, setErrorCode] = useState<LiveAssistErrorCode | null>(null)
  const [snapshot, setSnapshot] = useState<LiveAssistSnapshot | null>(null)
  const lastFetchAt = useRef(0)
  const inFlight = useRef(false)
  const nowRef = useRef(now)
  nowRef.current = now

  const runFetch = useCallback(async () => {
    if (inFlight.current) return
    if (!nextItem) {
      setErrorCode('NO_NEXT')
      setSnapshot(null)
      return
    }

    const destination = getMapDestination(nextItem)
    if (!destination) {
      setErrorCode('NO_DESTINATION')
      setSnapshot(null)
      return
    }

    const nextStart = parseTimeToMinutes(nextItem.time)
    if (nextStart === null) {
      setErrorCode('NO_DESTINATION')
      setSnapshot(null)
      return
    }

    inFlight.current = true
    setLoading(true)
    setErrorCode(null)

    try {
      const position = await getCurrentPosition()
      const originLat = position.coords.latitude
      const originLng = position.coords.longitude

      const geo = await geocodeDestination(destination)
      if (!geo) {
        setErrorCode('GEOCODE_FAILED')
        setSnapshot(null)
        return
      }

      const routeUrl =
        `/api/route?` +
        new URLSearchParams({
          originLat: String(originLat),
          originLng: String(originLng),
          destLat: String(geo.lat),
          destLng: String(geo.lng),
        }).toString()

      const routeRes = await fetch(routeUrl)
      const routeData: unknown = await routeRes.json().catch(() => null)
      if (!routeRes.ok || !routeData || typeof routeData !== 'object') {
        const err =
          routeData && typeof routeData === 'object'
            ? (routeData as { error?: string }).error
            : undefined
        setErrorCode(err === 'SERVER_MISCONFIGURED' ? 'SERVER_MISCONFIGURED' : 'ROUTE_FAILED')
        setSnapshot(null)
        return
      }

      const body = routeData as Record<string, unknown>
      if (body.ok !== true) {
        setErrorCode(
          body.error === 'SERVER_MISCONFIGURED' ? 'SERVER_MISCONFIGURED' : 'ROUTE_FAILED',
        )
        setSnapshot(null)
        return
      }

      const durationSeconds = Number(body.durationSeconds)
      const distanceMeters = Number(body.distanceMeters)
      if (!Number.isFinite(durationSeconds) || !Number.isFinite(distanceMeters)) {
        setErrorCode('ROUTE_FAILED')
        setSnapshot(null)
        return
      }

      const current = nowRef.current
      const etaMinutes = formatEtaMinutes(durationSeconds)
      const nowMinutes = current.getHours() * 60 + current.getMinutes()
      const recommended = getRecommendedDepartureMinutes(nextStart, etaMinutes)
      const status = getArrivalStatus(nowMinutes, recommended, nextStart, etaMinutes)

      setSnapshot({
        etaMinutes,
        distanceLabel: formatDistanceKm(distanceMeters),
        recommendedDepartureLabel: formatClockMinutes(recommended),
        status,
        statusMessage: arrivalStatusMessage(
          status,
          nowMinutes,
          recommended,
          nextStart,
          etaMinutes,
        ),
        directionsUrl: `https://map.kakao.com/link/to/${encodeURIComponent(nextItem.title || destination)},${geo.lat},${geo.lng}`,
        fetchedAt: Date.now(),
      })
      lastFetchAt.current = Date.now()
    } catch (err) {
      const geoErr = err as GeolocationPositionError
      if (typeof geoErr?.code === 'number') {
        if (geoErr.code === 1) setErrorCode('PERMISSION_DENIED')
        else if (geoErr.code === 3) setErrorCode('TIMEOUT')
        else if (geoErr.code === -1) setErrorCode('UNSUPPORTED')
        else setErrorCode('POSITION_UNAVAILABLE')
      } else {
        setErrorCode('UNKNOWN')
      }
      setSnapshot(null)
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }, [nextItem])

  const enable = useCallback(() => {
    setEnabled(true)
  }, [])

  const refresh = useCallback(() => {
    if (!enabled) return
    void runFetch()
  }, [enabled, runFetch])

  const disable = useCallback(() => {
    setEnabled(false)
    setSnapshot(null)
    setErrorCode(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!enabled) return
    void runFetch()
  }, [enabled, runFetch])

  useEffect(() => {
    if (!enabled) return

    const tick = () => {
      if (document.visibilityState !== 'visible') return
      if (!nextItem) return
      if (Date.now() - lastFetchAt.current < REFRESH_MS) return
      void runFetch()
    }

    const id = window.setInterval(tick, 30_000)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled, nextItem, runFetch])

  return {
    enabled,
    loading,
    errorCode,
    errorMessage: errorCode ? errorMessage(errorCode) : null,
    snapshot,
    enable,
    refresh,
    disable,
  }
}
