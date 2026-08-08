import { useEffect, useMemo, useState } from 'react'
import { ChecklistSection } from './components/ChecklistSection'
import { DayCard } from './components/DayCard'
import { Hero } from './components/Hero'
import { NoticeSection } from './components/NoticeSection'
import { ResetModal } from './components/ResetModal'
import { RestaurantSection } from './components/RestaurantSection'
import { TodayShortcut } from './components/TodayShortcut'
import { Toolbar } from './components/Toolbar'
import { TripSummary } from './components/TripSummary'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useNow } from './hooks/useNow'
import { isItinerary, type Day, type Itinerary } from './types'
import { createNextDay, findTodayDayIndex } from './utils/days'
import { getLiveDayStatus } from './utils/liveStatus'
import './styles.css'

export default function App() {
  const { itinerary, setItinerary, savedAt, saveFlash, resetToDefault } =
    useLocalStorage()
  const now = useNow()
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetStep, setResetStep] = useState<'warn' | 'confirm' | null>(null)
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  const [highlightedDayId, setHighlightedDayId] = useState<string | null>(null)
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null)
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!resetMessage) return
    const timer = window.setTimeout(() => setResetMessage(null), 3200)
    return () => window.clearTimeout(timer)
  }, [resetMessage])

  useEffect(() => {
    if (!highlightedDayId) return
    const timer = window.setTimeout(() => setHighlightedDayId(null), 1800)
    return () => window.clearTimeout(timer)
  }, [highlightedDayId])

  useEffect(() => {
    if (!highlightedItemId) return
    const timer = window.setTimeout(() => setHighlightedItemId(null), 1800)
    return () => window.clearTimeout(timer)
  }, [highlightedItemId])

  useEffect(() => {
    if (isEditing) setCollapsedDays({})
  }, [isEditing])

  const todayDayIndex = useMemo(
    () => findTodayDayIndex(itinerary.days, itinerary.startDate, now),
    [itinerary.days, itinerary.startDate, now],
  )

  const todayDay = todayDayIndex >= 0 ? itinerary.days[todayDayIndex] : null

  const liveStatus = useMemo(() => {
    if (!todayDay) return null
    return getLiveDayStatus(todayDay.items, now)
  }, [todayDay, now])

  const expandDay = (dayId: string) => {
    setCollapsedDays((prev) => {
      if (!prev[dayId]) return prev
      const next = { ...prev }
      delete next[dayId]
      return next
    })
  }

  const toggleDayCollapse = (dayId: string) => {
    setCollapsedDays((prev) => ({
      ...prev,
      [dayId]: !prev[dayId],
    }))
  }

  const scrollToElement = (elementId: string) => {
    window.setTimeout(() => {
      document.getElementById(elementId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 60)
  }

  const goToDay = (dayId: string) => {
    expandDay(dayId)
    setHighlightedDayId(dayId)
    scrollToElement(`day-${dayId}`)
  }

  const goToLiveTarget = () => {
    if (!todayDay) return
    expandDay(todayDay.id)

    if (liveStatus?.currentItemId) {
      setHighlightedItemId(liveStatus.currentItemId)
      scrollToElement(`item-${liveStatus.currentItemId}`)
      return
    }

    if (liveStatus?.nextItemId) {
      setHighlightedItemId(liveStatus.nextItemId)
      scrollToElement(`item-${liveStatus.nextItemId}`)
      return
    }

    goToDay(todayDay.id)
  }

  const patchItinerary = (patch: Partial<Itinerary>) => {
    setItinerary((prev) => ({ ...prev, ...patch }))
    setError(null)
  }

  const updateDay = (dayIndex: number, patch: Partial<Day>) => {
    setItinerary((prev) => ({
      ...prev,
      days: prev.days.map((day, i) => (i === dayIndex ? { ...day, ...patch } : day)),
    }))
  }

  const addDay = () => {
    setItinerary((prev) => ({
      ...prev,
      days: [...prev.days, createNextDay(prev.days, prev.startDate)],
    }))
    setError(null)
  }

  const deleteDay = (dayIndex: number) => {
    setItinerary((prev) => {
      if (prev.days.length <= 1) return prev
      return {
        ...prev,
        days: prev.days.filter((_, i) => i !== dayIndex),
      }
    })
    setError(null)
  }

  const moveDay = (dayIndex: number, direction: -1 | 1) => {
    setItinerary((prev) => {
      const target = dayIndex + direction
      if (target < 0 || target >= prev.days.length) return prev
      const days = [...prev.days]
      ;[days[dayIndex], days[target]] = [days[target], days[dayIndex]]
      return { ...prev, days }
    })
    setError(null)
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(itinerary, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'jeju-itinerary.json'
    a.click()
    URL.revokeObjectURL(url)
    setError(null)
  }

  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const parsed: unknown = JSON.parse(text)
      if (!isItinerary(parsed)) {
        setError('불러온 JSON 형식이 올바르지 않습니다. 일정 데이터 구조를 확인해 주세요.')
        return
      }
      setItinerary(parsed)
      setError(null)
    } catch {
      setError('JSON 파일을 읽지 못했습니다. 파일이 손상되었거나 형식이 잘못되었습니다.')
    }
  }

  const closeResetModal = () => setResetStep(null)

  const handleResetConfirm = () => {
    resetToDefault()
    setResetStep(null)
    setError(null)
    setResetMessage('기본 일정으로 복원되었습니다.')
  }

  return (
    <div className="app">
      <Hero
        itinerary={itinerary}
        isEditing={isEditing}
        onChange={patchItinerary}
      />

      <main className="main">
        <Toolbar
          isEditing={isEditing}
          onToggleMode={() => setIsEditing((v) => !v)}
          onExport={handleExport}
          onImport={handleImport}
          onReset={() => setResetStep('warn')}
          onPrint={() => window.print()}
          saveFlash={saveFlash}
          savedAt={savedAt}
          error={error}
          statusMessage={resetMessage}
        />

        <TripSummary
          itinerary={itinerary}
          isEditing={isEditing}
          onChange={patchItinerary}
        />

        {todayDay && liveStatus && (
          <TodayShortcut
            day={todayDay}
            dayNumber={todayDayIndex + 1}
            currentItem={liveStatus.currentItem}
            nextItem={liveStatus.nextItem}
            minutesUntilNext={liveStatus.minutesUntilNext}
            onGoToLive={goToLiveTarget}
          />
        )}

        <section className="days" aria-label="일자별 일정">
          {itinerary.days.map((day, index) => (
            <DayCard
              key={day.id}
              day={day}
              dayNumber={index + 1}
              isEditing={isEditing}
              isFirst={index === 0}
              isLast={index === itinerary.days.length - 1}
              canDelete={itinerary.days.length > 1}
              highlighted={highlightedDayId === day.id}
              highlightedItemId={highlightedItemId}
              collapsed={Boolean(collapsedDays[day.id])}
              onToggleCollapse={() => toggleDayCollapse(day.id)}
              liveStatus={index === todayDayIndex ? liveStatus : null}
              onChangeDay={(patch) => updateDay(index, patch)}
              onChangeItems={(items) => updateDay(index, { items })}
              onMoveUp={() => moveDay(index, -1)}
              onMoveDown={() => moveDay(index, 1)}
              onDelete={() => deleteDay(index)}
            />
          ))}
          {isEditing && (
            <button type="button" className="btn btn--add no-print" onClick={addDay}>
              + 날짜 추가
            </button>
          )}
        </section>

        <RestaurantSection
          restaurants={itinerary.restaurants}
          isEditing={isEditing}
          onChange={(restaurants) => patchItinerary({ restaurants })}
        />

        <ChecklistSection
          checklist={itinerary.checklist}
          isEditing={isEditing}
          onChange={(checklist) => patchItinerary({ checklist })}
        />

        <NoticeSection
          notices={itinerary.notices}
          isEditing={isEditing}
          onChange={(notices) => patchItinerary({ notices })}
        />

        <footer className="footer">
          <p>제주 친구 여행 일정 · 브라우저에 자동 저장됩니다</p>
        </footer>
      </main>

      <ResetModal
        step={resetStep}
        onCancel={closeResetModal}
        onContinue={() => setResetStep('confirm')}
        onConfirm={handleResetConfirm}
      />
    </div>
  )
}
