// src/components/CurrencyInput.tsx
import React, { useEffect, useState } from 'react'

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
}

const formatCurrency = (value: number): string => {
  if (isNaN(value)) return ''
  // Siempre formatea sin decimales
  return value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onChange, placeholder }) => {
  const [rawValue, setRawValue] = useState<string>(formatCurrency(value))

  useEffect(() => {
    setRawValue(formatCurrency(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    // Permitir solo dígitos, comas y puntos
    const cleaned = input.replace(/[^0-9,.]/g, '')
    setRawValue(cleaned)

    let normalized = ''
    if (cleaned.includes(',')) {
      // Si hay coma, se asume separador decimal: elimina todos los puntos y cambia la coma por punto
      normalized = cleaned.replace(/\./g, '')
      normalized = normalized.replace(',', '.')
    } else {
      // Si no hay coma, elimina los puntos (que serían separadores de miles)
      normalized = cleaned.replace(/\./g, '')
    }
    const parsed = parseFloat(normalized)
    if (!isNaN(parsed)) {
      onChange(parsed)
    } else {
      onChange(0)
    }
  }

  const handleBlur = () => {
    // Al perder el foco se formatea el valor para mostrarlo sin decimales y con separadores de miles
    setRawValue(formatCurrency(value))
  }

  return (
    <input
      type="text"
      value={rawValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
    />
  )
}

export default CurrencyInput
