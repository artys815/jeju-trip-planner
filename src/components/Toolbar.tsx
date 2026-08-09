import { useEffect, useState } from 'react'
import type { Day } from '../types'

interface ToolbarProps {
  isEditing: boolean
  hasUnsavedChanges: boolean
  canSave: boolean
  onStartEdit: () => void
  onSave: () => void
  onCancelEdit: () => void
  onExport: () => void
  onImport: (file: File) => void
  onReset: () => void
  onPrint: () => void
  saveFlash: boolean
  savedAt: Date | null
  error: string | null
  statusMessage?: string | null
  days: Day[]
  testModeEnabled: boolean
  testDayId: string
  testTime: string
  onEnableTestMode: () => void
  onDisableTestMode: () => void
  onChangeTestDayId: (dayId: string) => void
  onChangeTestTime: (time: string) => void
}

export function Toolbar({
  isEditing,
  hasUnsavedChanges,
  canSave,
  onStartEdit,
  onSave,
  onCancelEdit,
  onExport,
  onImport,
  onReset,
  onPrint,
  saveFlash,
  savedAt,
  error,
  statusMessage = null,
  days,
  testModeEnabled,
  testDayId,
  testTime,
  onEnableTestMode,
  onDisableTestMode,
  onChangeTestDayId,
  onChangeTestTime,
}: ToolbarProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (isEditing) setOpen(true)
  }, [isEditing])

  const panelOpen = open || isEditing

  return (
    <div className={`toolbar no-print${panelOpen ? ' toolbar--open' : ''}`}>
      <div className="toolbar__bar">
        <button
          type="button"
          className="toolbar__manage"
          aria-expanded={panelOpen}
          aria-controls="management-panel"
          onClick={() => {
            if (isEditing) return
            setOpen((value) => !value)
          }}
        >
          {isEditing ? '수정 중' : panelOpen ? '관리 닫기' : '⚙ 관리'}
        </button>

        {!panelOpen && (
          <span className="toolbar__bar-status" aria-live="polite">
            {statusMessage || (saveFlash ? '저장됨' : '관리 · 설정')}
          </span>
        )}
      </div>

      {panelOpen && (
        <div id="management-panel" className="toolbar__panel">
          {isEditing ? (
            <div className="toolbar__edit-actions">
              <p className="toolbar__edit-note">
                저장 전에는 변경사항이 실제 일정에 반영되지 않습니다.
              </p>
              {hasUnsavedChanges && (
                <p className="toolbar__unsaved" aria-live="polite">
                  저장되지 않은 변경사항
                </p>
              )}
              <div className="toolbar__actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={onSave}
                  disabled={!canSave}
                >
                  저장하기
                </button>
                <button type="button" className="btn btn--ghost" onClick={onCancelEdit}>
                  수정 취소
                </button>
              </div>
            </div>
          ) : (
            <div className="toolbar__modes" role="group" aria-label="보기 모드">
              <button
                type="button"
                className="toolbar__mode is-active"
                aria-pressed="true"
              >
                여행 일정 보기
              </button>
              <button
                type="button"
                className="toolbar__mode"
                onClick={() => {
                  onStartEdit()
                  setOpen(true)
                }}
              >
                일정 수정
              </button>
            </div>
          )}

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
            <button
              type="button"
              className="btn btn--primary"
              onClick={onPrint}
              disabled={isEditing}
            >
              인쇄·PDF 저장
            </button>
          </div>

          {!isEditing && (
            <div className="toolbar__test-mode">
              <p className="toolbar__edit-note">
                라이브 기능 테스트 · 실제 일정 날짜를 바꾸지 않습니다
              </p>
              {!testModeEnabled ? (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={onEnableTestMode}
                >
                  라이브 기능 테스트
                </button>
              ) : (
                <div className="toolbar__test-controls">
                  <label className="edit-field">
                    <span className="edit-field__label">테스트 DAY</span>
                    <select
                      className="edit-field__input"
                      value={testDayId}
                      onChange={(e) => onChangeTestDayId(e.target.value)}
                    >
                      {days.map((day, index) => (
                        <option key={day.id} value={day.id}>
                          DAY {index + 1} · {day.date} ({day.weekday})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="edit-field">
                    <span className="edit-field__label">시뮬레이션 시각</span>
                    <input
                      className="edit-field__input"
                      type="time"
                      value={testTime}
                      onChange={(e) => onChangeTestTime(e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={onDisableTestMode}
                  >
                    테스트 종료
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="toolbar__status" aria-live="polite">
            {statusMessage && <span className="toolbar__saved">{statusMessage}</span>}
            {!statusMessage && saveFlash && (
              <span className="toolbar__saved">저장됨</span>
            )}
            {!statusMessage && !saveFlash && !isEditing && savedAt && (
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
      )}
    </div>
  )
}
