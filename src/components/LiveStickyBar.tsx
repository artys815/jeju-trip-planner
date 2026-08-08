interface LiveStickyBarProps {
  nextTime: string
  nextTitle: string
  etaMinutes: number
  recommendedDepartureLabel: string
  onOpen: () => void
  onClose: () => void
}

export function LiveStickyBar({
  nextTime,
  nextTitle,
  etaMinutes,
  recommendedDepartureLabel,
  onOpen,
  onClose,
}: LiveStickyBarProps) {
  return (
    <div className="live-sticky no-print" role="region" aria-label="다음 일정 이동 요약">
      <button type="button" className="live-sticky__main" onClick={onOpen}>
        <span className="live-sticky__text">
          다음 {nextTime} {nextTitle} · 🚗 {etaMinutes}분 · {recommendedDepartureLabel}{' '}
          출발
        </span>
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
