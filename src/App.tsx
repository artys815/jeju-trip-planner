import { useState } from 'react'
import { CreateTripModal } from './components/CreateTripModal'
import { TripHome } from './components/TripHome'
import { TripWorkspace } from './components/TripWorkspace'
import { useTripCollection } from './hooks/useTripCollection'
import './styles.css'

export default function App() {
  const {
    collection,
    activeTrip,
    itinerary,
    setItinerary,
    screen,
    goHome,
    selectTrip,
    createTrip,
    duplicateTrip,
    deleteTrip,
    resetActiveItinerary,
    recoverLegacyIntoActive,
    savedAt,
    saveFlash,
  } = useTripCollection()

  const [createOpen, setCreateOpen] = useState(false)

  const handleDelete = (tripId: string) => {
    const target = collection.trips.find((trip) => trip.id === tripId)
    if (!target) return
    if (target.protected) {
      window.alert('현재 보호된 여행입니다.')
      return
    }
    const ok = window.confirm(
      `「${target.name}」 여행을 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`,
    )
    if (!ok) return
    const result = deleteTrip(tripId)
    if (!result.ok) {
      if (result.reason === 'PROTECTED') {
        window.alert('현재 보호된 여행입니다.')
      } else if (result.reason === 'LAST_TRIP') {
        window.alert('마지막 남은 여행은 삭제할 수 없습니다.')
      }
    }
  }

  if (screen === 'home' || !activeTrip) {
    return (
      <>
        <TripHome
          trips={collection.trips}
          onOpenTrip={selectTrip}
          onCreateTrip={() => setCreateOpen(true)}
          onDuplicateTrip={duplicateTrip}
          onDeleteTrip={handleDelete}
        />
        <CreateTripModal
          open={createOpen}
          onCancel={() => setCreateOpen(false)}
          onCreate={(input) => {
            createTrip(input)
            setCreateOpen(false)
          }}
        />
      </>
    )
  }

  return (
    <TripWorkspace
      trip={activeTrip}
      itinerary={itinerary}
      setItinerary={setItinerary}
      savedAt={savedAt}
      saveFlash={saveFlash}
      onBackHome={goHome}
      onResetActive={resetActiveItinerary}
      onRecoverLegacy={recoverLegacyIntoActive}
    />
  )
}
