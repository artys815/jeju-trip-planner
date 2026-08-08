interface EditActionsBarProps {
  hasUnsavedChanges: boolean
  canSave: boolean
  onSave: () => void
  onCancel: () => void
}

export function EditActionsBar({
  hasUnsavedChanges,
  canSave,
  onSave,
  onCancel,
}: EditActionsBarProps) {
  return (
    <div className="edit-actions-bar no-print" role="region" aria-label="수정 저장 도구">
      <div className="edit-actions-bar__inner">
        <p className="edit-actions-bar__hint">
          {hasUnsavedChanges
            ? '저장되지 않은 변경사항'
            : '저장 전에는 변경사항이 실제 일정에 반영되지 않습니다.'}
        </p>
        <div className="edit-actions-bar__buttons">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            수정 취소
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={onSave}
            disabled={!canSave}
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  )
}
