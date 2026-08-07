import { createId, type ChecklistItem } from '../types'

interface ChecklistSectionProps {
  checklist: ChecklistItem[]
  isEditing: boolean
  onChange: (checklist: ChecklistItem[]) => void
}

export function ChecklistSection({
  checklist,
  isEditing,
  onChange,
}: ChecklistSectionProps) {
  const toggle = (index: number) => {
    onChange(
      checklist.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item,
      ),
    )
  }

  const updateText = (index: number, text: string) => {
    onChange(checklist.map((item, i) => (i === index ? { ...item, text } : item)))
  }

  const remove = (index: number) => {
    if (!window.confirm('이 체크리스트 항목을 삭제할까요?')) return
    onChange(checklist.filter((_, i) => i !== index))
  }

  const add = () => {
    onChange([
      ...checklist,
      { id: createId('check'), text: '새 준비물', checked: false },
    ])
  }

  const doneCount = checklist.filter((c) => c.checked).length

  return (
    <section className="section" aria-labelledby="checklist-heading">
      <div className="section__heading-row">
        <h2 id="checklist-heading" className="section__title">
          준비 · 예약 체크리스트
        </h2>
        <span className="section__count">
          {doneCount}/{checklist.length}
        </span>
      </div>
      <ul className="checklist">
        {checklist.map((item, index) => (
          <li key={item.id} className={`checklist__item ${item.checked ? 'is-checked' : ''}`}>
            <label className="checklist__label">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggle(index)}
              />
              {isEditing ? (
                <input
                  className="checklist__text-input"
                  value={item.text}
                  onChange={(e) => updateText(index, e.target.value)}
                  aria-label="체크리스트 내용"
                />
              ) : (
                <span>{item.text}</span>
              )}
            </label>
            {isEditing && (
              <button
                type="button"
                className="btn btn--small btn--danger no-print"
                onClick={() => remove(index)}
                aria-label="항목 삭제"
              >
                삭제
              </button>
            )}
          </li>
        ))}
      </ul>
      {isEditing && (
        <button type="button" className="btn btn--add no-print" onClick={add}>
          + 항목 추가
        </button>
      )}
    </section>
  )
}
