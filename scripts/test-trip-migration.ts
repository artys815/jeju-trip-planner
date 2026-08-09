/**
 * Phase-1 migration & trip safety tests.
 * Run: npx --yes tsx scripts/test-trip-migration.ts
 */
import assert from 'node:assert/strict'
import {
  LEGACY_ITINERARY_BACKUP_KEY,
  LEGACY_ITINERARY_KEY,
  TRIPS_STORAGE_KEY,
} from '../src/data/storageKeys'
import type { Itinerary, TripCollection } from '../src/types'
import {
  loadOrMigrateTripCollection,
  type StorageLike,
} from '../src/utils/tripMigration'
import {
  createBlankItinerary,
  duplicateTrip,
  generateDaysForIsoRange,
  getTripStatus,
  sortTripsForHome,
  wrapItineraryAsTrip,
} from '../src/utils/trips'

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike & {
  raw: Map<string, string>
} {
  const map = new Map(Object.entries(initial))
  return {
    raw: map,
    getItem(key) {
      return map.has(key) ? map.get(key)! : null
    },
    setItem(key, value) {
      map.set(key, String(value))
    },
  }
}

function customizedLegacy(): Itinerary {
  return {
    title: '제주 3박 4일 친구들 여행 일정',
    subtitle: 'user edit',
    startDate: '2026.08.14',
    endDate: '2026.08.17',
    accommodation: '제주 신촌',
    vehicle: '15인승',
    travelers: 'friends',
    tags: ['바다'],
    days: [
      {
        id: 'day-1',
        date: '8.14',
        weekday: '금',
        area: 'a',
        theme: 't',
        accent: 'orange',
        items: [
          {
            id: 'd1-1',
            time: '11:00',
            title: '김녕 요트투어 사용자 수정',
            description: 'x',
            type: 'activity',
            mapQuery: '김녕요트',
            completed: false,
          },
        ],
      },
    ],
    restaurants: [],
    checklist: [],
    notices: ['note'],
  }
}

function main() {
  // TEST A — customized legacy preserved exactly; legacy untouched
  const customized = customizedLegacy()
  const storageA = createMemoryStorage({
    [LEGACY_ITINERARY_KEY]: JSON.stringify(customized),
  })
  const legacyBefore = storageA.getItem(LEGACY_ITINERARY_KEY)
  const resultA = loadOrMigrateTripCollection(storageA)

  assert.equal(resultA.didMigrate, true)
  assert.equal(resultA.usedLegacy, true)
  assert.equal(storageA.getItem(LEGACY_ITINERARY_KEY), legacyBefore)
  assert.ok(storageA.getItem(LEGACY_ITINERARY_BACKUP_KEY))
  assert.equal(resultA.collection.trips.length, 1)
  assert.equal(resultA.collection.trips[0].protected, true)
  assert.equal(
    JSON.stringify(resultA.collection.trips[0].itinerary),
    JSON.stringify(customized),
  )
  assert.equal(
    resultA.collection.trips[0].itinerary.days[0].items[0].title,
    '김녕 요트투어 사용자 수정',
  )

  // TEST B — refresh does not duplicate
  const resultB = loadOrMigrateTripCollection(storageA)
  assert.equal(resultB.didMigrate, false)
  assert.equal(resultB.collection.trips.length, 1)
  assert.equal(storageA.getItem(LEGACY_ITINERARY_KEY), legacyBefore)

  // TEST C — blank trip day generation (부산 주말)
  const busan = createBlankItinerary({
    name: '부산 주말여행',
    startIso: '2026-09-05',
    endIso: '2026-09-06',
  })
  assert.equal(busan.days.length, 2)
  assert.equal(busan.days[0].date, '9.5')
  assert.equal(busan.days[1].date, '9.6')
  assert.equal(busan.days[0].items.length, 0)
  assert.equal(busan.title, '부산 주말여행')
  assert.ok(!JSON.stringify(busan).includes('김녕'))

  const range = generateDaysForIsoRange('2026-09-10', '2026-09-12')
  assert.equal(range.length, 3)
  assert.equal(range[0].weekday, '목')
  assert.equal(range[1].weekday, '금')
  assert.equal(range[2].weekday, '토')

  // TEST D — duplicate deep copy with new ids
  const busanTrip = wrapItineraryAsTrip(busan, { name: '부산 주말여행' })
  const copy = duplicateTrip(busanTrip)
  assert.equal(copy.name, '부산 주말여행 복사본')
  assert.notEqual(copy.id, busanTrip.id)
  assert.notEqual(copy.itinerary.days[0].id, busanTrip.itinerary.days[0].id)
  copy.itinerary.title = 'mutated copy'
  assert.notEqual(busanTrip.itinerary.title, 'mutated copy')
  assert.equal(copy.protected, false)

  // TEST E — protected Jeju cannot be deleted (policy check)
  assert.equal(resultA.collection.trips[0].protected, true)

  // TEST G — writing trips collection must not rewrite legacy
  const edited: TripCollection = structuredClone(resultA.collection)
  edited.trips[0].itinerary.title = 'edited in multi-trip'
  storageA.setItem(TRIPS_STORAGE_KEY, JSON.stringify(edited))
  assert.equal(storageA.getItem(LEGACY_ITINERARY_KEY), legacyBefore)

  // Sorting: active before upcoming before past
  const now = new Date(2026, 7, 15) // Aug 15, 2026 during Jeju trip
  const trips = [
    wrapItineraryAsTrip(
      createBlankItinerary({
        name: 'past',
        startIso: '2026-07-01',
        endIso: '2026-07-02',
      }),
      { name: 'past' },
    ),
    wrapItineraryAsTrip(
      createBlankItinerary({
        name: 'upcoming',
        startIso: '2026-09-01',
        endIso: '2026-09-02',
      }),
      { name: 'upcoming' },
    ),
    wrapItineraryAsTrip(structuredClone(customized), {
      name: 'active-jeju',
      protected: true,
    }),
  ]
  const sorted = sortTripsForHome(trips, now)
  assert.equal(sorted[0].name, 'active-jeju')
  assert.equal(getTripStatus(sorted[0], now).kind, 'active')
  assert.equal(sorted[1].name, 'upcoming')
  assert.equal(sorted[2].name, 'past')

  console.log('All migration safety tests passed.')
}

main()
