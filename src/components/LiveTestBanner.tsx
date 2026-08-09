interface LiveTestBannerProps {
  dayLabel: string
  time: string
  onExit: () => void
}

export function LiveTestBanner({ dayLabel, time, onExit }: LiveTestBannerProps) {
  return (
    <aside className="live-test-banner no-print" role="status" aria-live="polite">
      <div className="live-test-banner__copy">
        <p className="live-test-banner__title">테스트 모드</p>
        <p className="live-test-banner__text">
          실제 여행 시간이 아닙니다 · {dayLabel} · {time}
        </p>
      </div>
      <button type="button" className="btn btn--ghost live-test-banner__exit" onClick={onExit}>
        테스트 종료
      </button>
    </aside>
  )
}
