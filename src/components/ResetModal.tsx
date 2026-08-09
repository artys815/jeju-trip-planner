import { useEffect, useId, useRef, useState } from 'react'

interface ResetModalProps {
  step: 'warn' | 'confirm' | null
  mode?: 'jeju-default' | 'empty'
  onCancel: () => void
  onContinue: () => void
  onConfirm: () => void
}

const CONFIRM_WORD = '초기화'

export function ResetModal({
  step,
  mode = 'jeju-default',
  onCancel,
  onContinue,
  onConfirm,
}: ResetModalProps) {
  const titleId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (step === 'confirm') {
      setTyped('')
      const timer = window.setTimeout(() => inputRef.current?.focus(), 50)
      return () => window.clearTimeout(timer)
    }
    if (step === null) setTyped('')
  }, [step])

  useEffect(() => {
    if (!step) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [step, onCancel])

  if (!step) return null

  const canReset = typed === CONFIRM_WORD
  const title =
    mode === 'jeju-default' ? '제주 기본 일정 복원' : '빈 일정으로 초기화'
  const warnBody =
    mode === 'jeju-default'
      ? '현재 수정한 제주 여행 일정이 모두 삭제되고 제주 기본 일정으로 돌아갑니다. 이 작업은 되돌릴 수 없습니다.'
      : '현재 여행의 일정을 모두 지우고 날짜만 남은 빈 일정으로 초기화합니다. 제주 기본 일정이 다른 여행에 들어가지 않습니다.'
  const confirmAction =
    mode === 'jeju-default' ? '제주 기본 일정으로 복원' : '빈 일정으로 초기화'

  return (
    <div className="reset-modal no-print" role="presentation">
      <button
        type="button"
        className="reset-modal__backdrop"
        aria-label="닫기"
        onClick={onCancel}
      />
      <div
        className="reset-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {step === 'warn' ? (
          <>
            <h2 id={titleId} className="reset-modal__title">
              {title}
            </h2>
            <p className="reset-modal__body">{warnBody}</p>
            <div className="reset-modal__actions">
              <button type="button" className="btn btn--ghost" onClick={onCancel}>
                취소
              </button>
              <button type="button" className="btn btn--primary" onClick={onContinue}>
                계속
              </button>
            </div>
          </>
        ) : (
          <form
            className="reset-modal__form"
            onSubmit={(event) => {
              event.preventDefault()
              if (!canReset) return
              onConfirm()
            }}
          >
            <h2 id={titleId} className="reset-modal__title">
              정말 초기화하시겠습니까?
            </h2>
            <p className="reset-modal__body">
              계속하려면 아래 입력란에 <strong>{CONFIRM_WORD}</strong>를 정확히
              입력하세요.
            </p>
            <label className="edit-field" htmlFor="reset-confirm-input">
              <span className="edit-field__label">확인 문구</span>
              <input
                ref={inputRef}
                id="reset-confirm-input"
                className="edit-field__input"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                placeholder={CONFIRM_WORD}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </label>
            <div className="reset-modal__actions">
              <button type="button" className="btn btn--ghost" onClick={onCancel}>
                취소
              </button>
              <button
                type="submit"
                className="btn btn--danger-solid"
                disabled={!canReset}
              >
                {confirmAction}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
