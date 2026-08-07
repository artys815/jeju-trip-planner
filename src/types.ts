export type ItemType =
  | 'travel'
  | 'meal'
  | 'activity'
  | 'stay'
  | 'shopping'
  | 'other'

export type DayAccent = 'orange' | 'blue' | 'teal' | 'coral'

export interface ItineraryItem {
  id: string
  time: string
  title: string
  description: string
  type: ItemType
  mapQuery: string
  /** Optional precise address; preferred over mapQuery for Naver Map search. */
  address?: string
  completed: boolean
}

export function getMapSearchValue(item: Pick<ItineraryItem, 'mapQuery' | 'address'>): string {
  const address = item.address?.trim() ?? ''
  if (address) return address
  return item.mapQuery.trim()
}

export interface Day {
  id: string
  date: string
  weekday: string
  area: string
  theme: string
  accent: DayAccent
  items: ItineraryItem[]
}

export interface Restaurant {
  id: string
  name: string
  menu: string
  note: string
}

export interface ChecklistItem {
  id: string
  text: string
  checked: boolean
}

export interface Itinerary {
  title: string
  subtitle: string
  startDate: string
  endDate: string
  accommodation: string
  vehicle: string
  travelers: string
  tags: string[]
  days: Day[]
  restaurants: Restaurant[]
  checklist: ChecklistItem[]
  notices: string[]
}

export const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: 'travel', label: '이동' },
  { value: 'meal', label: '식사' },
  { value: 'activity', label: '체험' },
  { value: 'stay', label: '숙소' },
  { value: 'shopping', label: '쇼핑' },
  { value: 'other', label: '기타' },
]

export function createId(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function isItinerary(value: unknown): value is Itinerary {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string, unknown>
  return (
    typeof data.title === 'string' &&
    typeof data.subtitle === 'string' &&
    typeof data.startDate === 'string' &&
    typeof data.endDate === 'string' &&
    typeof data.accommodation === 'string' &&
    typeof data.vehicle === 'string' &&
    typeof data.travelers === 'string' &&
    Array.isArray(data.tags) &&
    Array.isArray(data.days) &&
    Array.isArray(data.restaurants) &&
    Array.isArray(data.checklist) &&
    Array.isArray(data.notices)
  )
}
