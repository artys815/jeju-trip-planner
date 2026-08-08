import { useEffect, useMemo, useState } from 'react'
import { ChecklistSection } from './components/ChecklistSection'
import { DayCard } from './components/DayCard'
import { EditActionsBar } from './components/EditActionsBar'
import { Hero } from './components/Hero'
import { LiveStickyBar } from './components/LiveStickyBar'
import { NoticeSection } from './components/NoticeSection'
import { ResetModal } from './components/ResetModal'
import { RestaurantSection } from './components/RestaurantSection'
import { TodayShortcut } from './components/TodayShortcut'
import { Toolbar } from './components/Toolbar'
import { TripSummary } from './components/TripSummary'
import { useLiveTravelAssistant } from './hooks/useLiveTravelAssistant'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useNow } from './hooks/useNow'
import { isItinerary, type Day, type Itinerary } from './types'
import { createNextDay, findTodayDayIndex } from './utils/days'
import { getLiveDayStatus } from './utils/liveStatus'
import { validateItineraryDraft } from './utils/validateItinerary'
import './styles.css'

function cloneItinerary(value: Itinerary): Itinerary {
  return structuredClone(value)
}

function itinerariesEqual(a: Itinerary, b: Itinerary): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export default function App() {
  const { itinerary, setItinerary, savedAt, saveFlash, resetToDefault } =
    useLocalStorage()
  const now = useNow()
  const [draft, setDraft] = useState<Itinerary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resetStep, setResetStep] = useState<'warn' | 'confirm' | null>(null)
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  const [highlightedDayId, setHighlightedDayId] = useState<string | null>(null)
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null)
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({})
  const [stickyHidden, setStickyHidden] = useState(false)

  const isEditing = draft !== null
  const display = draft ?? itinerary
  const hasUnsavedChanges = Boolean(draft && !itinerariesEqual(draft, itinerary))

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

  useEffect(() => {
    if (!isEditing || !hasUnsavedChanges) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isEditing, hasUnsavedChanges])

  // Live status always uses committed itinerary (not unsaved draft).
  const todayDayIndex = useMemo(
    () => findTodayDayIndex(itinerary.days, itinerary.startDate, now),
    [itinerary.days, itinerary.startDate, now],
  )

  const todayDay = todayDayIndex >= 0 ? itinerary.days[todayDayIndex] : null

  const liveStatus = useMemo(() => {
    if (!todayDay) return null
    return getLiveDayStatus(todayDay.items, now)
  }, [todayDay, now])

  const liveAssist = useLiveTravelAssistant(liveStatus?.nextItem ?? null, now)

  const tripYearNotice = useMemo(() => {
    if (!isEditing || !draft) return null
    if (
      draft.startDate === itinerary.startDate &&
      draft.endDate === itinerary.endDate
    ) {
      return null
    }
    return '여행 시작·종료일을 바꿔도 DAY 날짜는 자동으로 다시 맞춰지지 않습니다. 필요하면 DAY 날짜를 직접 확인해 주세요.'
  }, [isEditing, draft, itinerary.startDate, itinerary.endDate])

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

  const confirmDiscardIfNeeded = (): boolean => {
    if (!hasUnsavedChanges) return true
    return window.confirm(
      '저장하지 않은 변경사항이 있습니다.\n수정을 취소하시겠습니까?',
    )
  }

  const startEdit = () => {
    setDraft(cloneItinerary(itinerary))
    setError(null)
  }

  const cancelEdit = () => {
    if (!confirmDiscardIfNeeded()) return
    setDraft(null)
    setError(null)
  }

  const saveEdit = () => {
    if (!draft) return
    const issues = validateItineraryDraft(draft)
    if (issues.length > 0) {
      setError(issues[0].message)
      if (issues[0].fieldId) {
        scrollToElement(issues[0].fieldId)
        window.setTimeout(() => {
          document.getElementById(issues[0].fieldId!)?.focus()
        }, 80)
      }
      return
    }

    setItinerary(cloneItinerary(draft))
    setDraft(null)
    setError(null)
    setResetMessage('변경사항이 저장되었습니다.')
  }

  const patchDisplay = (patch: Partial<Itinerary>) => {
    if (!draft) return
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev))
    setError(null)
  }

  const updateDay = (dayIndex: number, patch: Partial<Day>) => {
    if (!draft) return
    setDraft((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        days: prev.days.map((day, i) => (i === dayIndex ? { ...day, ...patch } : day)),
      }
    })
    setError(null)
  }

  const addDay = () => {
    if (!draft) return
    setDraft((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        days: [...prev.days, createNextDay(prev.days, prev.startDate)],
      }
    })
    setError(null)
  }

  const deleteDay = (dayIndex: number) => {
    if (!draft) return
    setDraft((prev) => {
      if (!prev || prev.days.length <= 1) return prev
      return {
        ...prev,
        days: prev.days.filter((_, i) => i !== dayIndex),
      }
    })
    setError(null)
  }

  const moveDay = (dayIndex: number, direction: -1 | 1) => {
    if (!draft) return
    setDraft((prev) => {
      if (!prev) return prev
      const target = dayIndex + direction
      if (target < 0 || target >= prev.days.length) return prev
      const days = [...prev.days]
      ;[days[dayIndex], days[target]] = [days[target], days[dayIndex]]
      return { ...prev, days }
    })
    setError(null)
  }

  const handleExport = () => {
    const payload = isEditing && draft ? draft : itinerary
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
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
    if (isEditing && hasUnsavedChanges) {
      const ok = window.confirm(
        '저장하지 않은 수정 내용이 있습니다. 계속하면 수정 내용이 사라집니다.',
      )
      if (!ok) return
    }

    try {
      const text = await file.text()
      const parsed: unknown = JSON.parse(text)
      if (!isItinerary(parsed)) {
        setError('불러온 JSON 형식이 올바르지 않습니다. 일정 데이터 구조를 확인해 주세요.')
        return
      }
      setItinerary(parsed)
      setDraft(null)
      setError(null)
      setResetMessage('JSON을 불러왔습니다.')
    } catch {
      setError('JSON 파일을 읽지 못했습니다. 파일이 손상되었거나 형식이 잘못되었습니다.')
    }
  }

  const requestReset = () => {
    if (isEditing && hasUnsavedChanges) {
      const ok = window.confirm(
        '저장하지 않은 수정 내용이 있습니다. 계속하면 수정 내용이 사라집니다.',
      )
      if (!ok) return
    }
    setResetStep('warn')
  }

  const closeResetModal = () => setResetStep(null)

  const handleResetConfirm = () => {
    resetToDefault()
    setDraft(null)
    setResetStep(null)
    setError(null)
    setResetMessage('기본 일정으로 복원되었습니다.')
  }

  const showTravelDayLive = Boolean(todayDay && liveStatus && !isEditing)
  const showStickyBar = Boolean(
    todayDay && liveStatus?.nextItem && !isEditing && !stickyHidden,
  )

  return (
    <div
      className={[
        'app',
        showStickyBar ? 'app--sticky-live' : '',
        isEditing ? 'app--editing' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Hero
        itinerary={display}
        isEditing={isEditing}
        onChange={patchDisplay}
        dateNotice={isEditing ? tripYearNotice : null}
      />

      <main className="main">
        {showTravelDayLive && todayDay && liveStatus && (
          <TodayShortcut
            day={todayDay}
            dayNumber={todayDayIndex + 1}
            currentItem={liveStatus.currentItem}
            nextItem={liveStatus.nextItem}
            minutesUntilNext={liveStatus.minutesUntilNext}
            onGoToLive={goToLiveTarget}
            liveEnabled={liveAssist.enabled}
            liveLoading={liveAssist.loading}
            liveError={liveAssist.errorMessage}
            liveSnapshot={liveAssist.snapshot}
            onEnableLive={liveAssist.enable}
            onRefreshLive={liveAssist.refresh}
            onDisableLive={() => {
              liveAssist.disable()
              setStickyHidden(false)
            }}
          />
        )}

        <Toolbar
          isEditing={isEditing}
          hasUnsavedChanges={hasUnsavedChanges}
          canSave={hasUnsavedChanges}
          onStartEdit={startEdit}
          onSave={saveEdit}
          onCancelEdit={cancelEdit}
          onExport={handleExport}
          onImport={handleImport}
          onReset={requestReset}
          onPrint={() => window.print()}
          saveFlash={saveFlash}
          savedAt={savedAt}
          error={error}
          statusMessage={resetMessage}
        />

        <TripSummary
          itinerary={display}
          isEditing={isEditing}
          onChange={patchDisplay}
        />

        <section className="days" aria-label="일자별 일정">
          {display.days.map((day, index) => (
            <DayCard
              key={day.id}
              day={day}
              dayNumber={index + 1}
              startDate={display.startDate}
              isEditing={isEditing}
              isFirst={index === 0}
              isLast={index === display.days.length - 1}
              canDelete={display.days.length > 1}
              highlighted={highlightedDayId === day.id}
              highlightedItemId={highlightedItemId}
              collapsed={Boolean(collapsedDays[day.id])}
              onToggleCollapse={() => toggleDayCollapse(day.id)}
              liveStatus={
                !isEditing && index === todayDayIndex ? liveStatus : null
              }
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
          restaurants={display.restaurants}
          isEditing={isEditing}
          onChange={(restaurants) => patchDisplay({ restaurants })}
        />

        <ChecklistSection
          checklist={display.checklist}
          isEditing={isEditing}
          onChange={(checklist) => patchDisplay({ checklist })}
        />

        <NoticeSection
          notices={display.notices}
          isEditing={isEditing}
          onChange={(notices) => patchDisplay({ notices })}
        />

        <footer className="footer">
          <p>
            {isEditing
              ? '수정 중 · 저장하기를 눌러야 일정에 반영됩니다'
              : '제주 친구 여행 일정 · 브라우저에 자동 저장됩니다'}
          </p>
        </footer>
      </main>

      <ResetModal
        step={resetStep}
        onCancel={closeResetModal}
        onContinue={() => setResetStep('confirm')}
        onConfirm={handleResetConfirm}
      />

      {isEditing && (
        <EditActionsBar
          hasUnsavedChanges={hasUnsavedChanges}
          canSave={hasUnsavedChanges}
          onSave={saveEdit}
          onCancel={cancelEdit}
        />
      )}

      {showStickyBar && todayDay && liveStatus?.nextItem && (
        <LiveStickyBar
          nextTime={liveStatus.nextItem.time}
          nextTitle={liveStatus.nextItem.title}
          etaMinutes={liveAssist.snapshot?.etaMinutes ?? null}
          recommendedDepartureLabel={
            liveAssist.snapshot?.recommendedDepartureLabel ?? null
          }
          onOpen={goToLiveTarget}
          onClose={() => setStickyHidden(true)}
        />
      )}
    </div>
  )
}
