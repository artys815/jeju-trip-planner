interface ToolbarProps {
  isEditing: boolean
  onToggleMode: () => void
  onExport: () => void
  onImport: (file: File) => void
  onReset: () => void
  onPrint: () => void
  saveFlash: boolean
  savedAt: Date | null
  error: string | null
  statusMessage?: string | null
}

export function Toolbar({
  isEditing,
  onToggleMode,
  onExport,
  onImport,
  onReset,
  onPrint,
  saveFlash,
  savedAt,
  error,
  statusMessage = null,
}: ToolbarProps) {
  return (
    <div className="toolbar no-print">
      <div className="toolbar__modes" role="group" aria-label="보기 모드">
        <button
          type="button"
          className={`toolbar__mode ${!isEditing ? 'is-active' : ''}`}
          onClick={() => isEditing && onToggleMode()}
          aria-pressed={!isEditing}
        >
          여행 일정 보기
        </button>
        <button
          type="button"
          className={`toolbar__mode ${isEditing ? 'is-active' : ''}`}
          onClick={() => !isEditing && onToggleMode()}
          aria-pressed={isEditing}
        >
          일정 수정
        </button>
      </div>

      <div className="toolbar__actions">
        <button type="button" className="btn btn--ghost" onClick={onExport}>
          JSON 내보내기
        </button>
        <label className="btn btn--ghost toolbar__file">
          JSON 불러오기
          <input
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onImport(file)
              e.target.value = ''
            }}
          />
        </label>
        <button type="button" className="btn btn--ghost" onClick={onReset}>
          기본 일정 복원
        </button>
        <button type="button" className="btn btn--primary" onClick={onPrint}>
          인쇄·PDF 저장
        </button>
      </div>

      <div className="toolbar__status" aria-live="polite">
        {statusMessage && <span className="toolbar__saved">{statusMessage}</span>}
        {!statusMessage && saveFlash && <span className="toolbar__saved">저장됨</span>}
        {!statusMessage && !saveFlash && savedAt && (
          <span className="toolbar__saved-quiet">
            자동 저장 ·{' '}
            {savedAt.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
        {error && <span className="toolbar__error">{error}</span>}
      </div>
    </div>
  )
}
