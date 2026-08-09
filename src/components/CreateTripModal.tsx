import { useEffect, useId, useState } from 'react'
import { EditField } from './EditField'

interface CreateTripModalProps {
  open: boolean
  onCancel: () => void
  onCreate: (input: {
    name: string
    startIso: string
    endIso: string
    accommodation?: string
    vehicle?: string
    travelers?: string
  }) => void
}

export function CreateTripModal({
  open,
  onCancel,
  onCreate,
}: CreateTripModalProps) {
  const titleId = useId()
  const [name, setName] = useState('')
  const [startIso, setStartIso] = useState('')
  const [endIso, setEndIso] = useState('')
  const [accommodation, setAccommodation] = useState('')
  const [vehicle, setVehicle] = useState('')
  const [travelers, setTravelers] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName('')
    setStartIso('')
    setEndIso('')
    setAccommodation('')
    setVehicle('')
    setTravelers('')
    setError(null)
  }, [open])

  useEffect(() => {
    if (!open) return
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
  }, [open, onCancel])

  if (!open) return null

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('여행 이름을 입력해 주세요.')
      return
    }
    if (!startIso || !endIso) {
      setError('시작일과 종료일을 선택해 주세요.')
      return
    }
    if (endIso < startIso) {
      setError('종료일은 시작일 이후여야 합니다.')
      return
    }
    onCreate({
      name: trimmed,
      startIso,
      endIso,
      accommodation,
      vehicle,
      travelers,
    })
  }

  return (
    <div className="reset-modal no-print" role="presentation">
      <button
        type="button"
        className="reset-modal__backdrop"
        aria-label="닫기"
        onClick={onCancel}
      />
      <div
        className="reset-modal__dialog create-trip-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="reset-modal__title">
          새 여행 만들기
        </h2>
        <div className="create-trip-form">
          <EditField
            label="여행 이름"
            value={name}
            onChange={setName}
            placeholder="예: 부산 주말여행"
          />
          <div className="hero__edit-row">
            <EditField
              label="시작일"
              type="date"
              value={startIso}
              onChange={setStartIso}
            />
            <EditField
              label="종료일"
              type="date"
              value={endIso}
              onChange={setEndIso}
            />
          </div>
          <EditField
            label="숙소 / 주요 거점 (선택)"
            value={accommodation}
            onChange={setAccommodation}
            placeholder="예: 해운대"
          />
          <EditField
            label="이동수단 (선택)"
            value={vehicle}
            onChange={setVehicle}
            placeholder="예: 렌터카"
          />
          <EditField
            label="인원 / 여행 멤버 (선택)"
            value={travelers}
            onChange={setTravelers}
            placeholder="예: 가족 4명"
          />
          {error ? <p className="toolbar__error">{error}</p> : null}
        </div>
        <div className="reset-modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            취소
          </button>
          <button type="button" className="btn btn--primary" onClick={submit}>
            여행 만들기
          </button>
        </div>
      </div>
    </div>
  )
}
