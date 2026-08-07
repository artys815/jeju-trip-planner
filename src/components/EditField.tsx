interface EditFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  type?: 'text' | 'time'
  placeholder?: string
  className?: string
}

export function EditField({
  label,
  value,
  onChange,
  multiline = false,
  type = 'text',
  placeholder,
  className = '',
}: EditFieldProps) {
  const id = `field-${label.replace(/\s+/g, '-')}`
  const fieldClass = ['edit-field', className].filter(Boolean).join(' ')

  return (
    <label className={fieldClass} htmlFor={id}>
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
