interface EditFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  type?: 'text' | 'time'
  placeholder?: string
}

export function EditField({
  label,
  value,
  onChange,
  multiline = false,
  type = 'text',
  placeholder,
}: EditFieldProps) {
  const id = `field-${label.replace(/\s+/g, '-')}`

  return (
    <label className="edit-field" htmlFor={id}>
      <span className="edit-field__label">{label}</span>
      {multiline ? (
        <textarea
          id={id}
          className="edit-field__input edit-field__textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <input
          id={id}
          className="edit-field__input"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  )
}
