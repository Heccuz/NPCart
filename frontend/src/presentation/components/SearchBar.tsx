import { useEffect, useState } from 'react'
import { useDebounce } from '../hooks/useDebounce'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar mini, serie o temática…',
}: SearchBarProps) {
  const [text, setText] = useState(value)
  const debounced = useDebounce(text, 300)

  useEffect(() => {
    setText(value)
    // Sincroniza cuando la URL cambia desde fuera (chips, limpiar).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    if (debounced !== value) onChange(debounced)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  return (
    <label className="relative block">
      <span className="sr-only">Buscar productos</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/60"
      >
        <circle cx="11" cy="11" r="6.5" />
        <path d="m20 20-4.2-4.2" />
      </svg>
      <input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        className="input h-12 pl-12 pr-4 text-base"
      />
    </label>
  )
}
