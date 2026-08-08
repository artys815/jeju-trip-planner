interface LiveStickyBarProps {
  nextTime: string
  nextTitle: string
  etaMinutes?: number | null
  recommendedDepartureLabel?: string | null
  onOpen: () => void
  onClose: () => void
}

export function LiveStickyBar({
  nextTime,
  nextTitle,
  etaMinutes = null,
  recommendedDepartureLabel = null,
  onOpen,
  onClose,
}: LiveStickyBarProps) {
  const hasEta =
    typeof etaMinutes === 'number' &&
    Number.isFinite(etaMinutes) &&
    Boolean(recommendedDepartureLabel)

  const text = hasEta
    ? `다음 ${nextTime} ${nextTitle} · 🚗 ${etaMinutes}분 · ${recommendedDepartureLabel} 출발`
    : `다음 ${nextTime} ${nextTitle}`

  return (
    <div className="live-sticky no-print" role="region" aria-label="다음 일정 이동 요약">
      <button type="button" className="live-sticky__main" onClick={onOpen}>
        <span className="live-sticky__text">{text}</span>
      </button>
      <button
        type="button"
        className="live-sticky__close"
        onClick={onClose}
        aria-label="요약 닫기"
      >
        닫기
      </button>
    </div>
  )
}
