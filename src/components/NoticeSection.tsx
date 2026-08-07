interface NoticeSectionProps {
  notices: string[]
  isEditing: boolean
  onChange: (notices: string[]) => void
}

export function NoticeSection({ notices, isEditing, onChange }: NoticeSectionProps) {
  const update = (index: number, value: string) => {
    onChange(notices.map((n, i) => (i === index ? value : n)))
  }

  const remove = (index: number) => {
    if (!window.confirm('이 안내 문구를 삭제할까요?')) return
    onChange(notices.filter((_, i) => i !== index))
  }

  const add = () => {
    onChange([...notices, '새 안내 문구'])
  }

  return (
    <section className="section notice-section" aria-labelledby="notice-heading">
      <h2 id="notice-heading" className="section__title">
        꼭 알아두기
      </h2>
      <ul className="notice-list">
        {notices.map((notice, index) => (
          <li key={`notice-${index}`} className="notice-list__item">
            {isEditing ? (
              <div className="notice-list__edit">
                <textarea
                  className="edit-field__input edit-field__textarea"
                  value={notice}
                  onChange={(e) => update(index, e.target.value)}
                  rows={3}
                  aria-label={`안내 ${index + 1}`}
                />
                <button
                  type="button"
                  className="btn btn--small btn--danger no-print"
                  onClick={() => remove(index)}
                >
                  삭제
                </button>
              </div>
            ) : (
              <p>{notice}</p>
            )}
          </li>
        ))}
      </ul>
      {isEditing && (
        <button type="button" className="btn btn--add no-print" onClick={add}>
          + 안내 추가
        </button>
      )}
    </section>
  )
}
