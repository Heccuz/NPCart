interface QuantityStepperProps {
  value: number
  max: number
  onChange: (value: number) => void
}

export default function QuantityStepper({ value, max, onChange }: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-ink/15 bg-white/70">
      <button
        type="button"
        aria-label="Quitar una unidad"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        className="flex h-11 w-11 items-center justify-center rounded-l-full text-lg font-medium transition hover:bg-ink/5 disabled:opacity-30"
      >
        −
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Agregar una unidad"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="flex h-11 w-11 items-center justify-center rounded-r-full text-lg font-medium transition hover:bg-ink/5 disabled:opacity-30"
      >
        +
      </button>
    </div>
  )
}
