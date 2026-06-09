'use client'

import { useTranslations } from 'next-intl'
import type { FieldDef, SubcategoryConfig } from '@/lib/constants/subcategory-fields'
import type { ListingFormData } from './ListingForm'

interface Props {
  config: SubcategoryConfig
  formData: ListingFormData
  onColumnChange: (field: keyof ListingFormData, value: string) => void
  onJsonbChange: (key: string, value: string | number | null) => void
  inputClassName: string
  selectClassName: string
  labelClassName: string
}

function FieldRenderer({
  field,
  formData,
  onColumnChange,
  onJsonbChange,
  inputClassName,
  selectClassName,
  labelClassName,
}: Omit<Props, 'config'> & { field: FieldDef }) {
  const t = useTranslations('addItem')

  const isJsonb = field.storage === 'jsonb'
  const currentValue = isJsonb
    ? ((formData.listing_details[field.key] as string) || '')
    : ((formData[field.storage as keyof ListingFormData] as string) || '')

  function handleChange(value: string) {
    if (isJsonb) {
      if (field.type === 'integer') {
        onJsonbChange(field.key, value ? parseInt(value, 10) : null)
      } else {
        onJsonbChange(field.key, value || null)
      }
    } else {
      onColumnChange(field.storage as keyof ListingFormData, value)
    }
  }

  const id = `sf-${field.key}`
  const label = t(field.labelKey as Parameters<typeof t>[0])

  if (field.type === 'select' || field.type === 'boolean_select') {
    const placeholderKey = field.selectPlaceholderKey as Parameters<typeof t>[0] | undefined
    return (
      <div className={field.fullWidth ? 'col-span-2' : undefined}>
        <label htmlFor={id} className={labelClassName}>{label}</label>
        <select id={id} value={currentValue} onChange={(e) => handleChange(e.target.value)} className={selectClassName}>
          <option value="">{placeholderKey ? t(placeholderKey) : label}</option>
          {field.options?.map(opt => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey as Parameters<typeof t>[0])}
            </option>
          ))}
        </select>
      </div>
    )
  }

  // text or integer
  const placeholder = field.placeholderKey
    ? t(field.placeholderKey as Parameters<typeof t>[0])
    : undefined

  return (
    <div className={field.fullWidth ? 'col-span-2' : undefined}>
      <label htmlFor={id} className={labelClassName}>{label}</label>
      <input
        id={id}
        type={field.type === 'integer' ? 'number' : 'text'}
        dir={field.dir ?? 'auto'}
        value={currentValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={inputClassName}
        {...(field.type === 'integer' ? { min: 0 } : {})}
      />
    </div>
  )
}

export default function SubcategoryFields({
  config,
  formData,
  onColumnChange,
  onJsonbChange,
  inputClassName,
  selectClassName,
  labelClassName,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {config.fields.map(field => (
        <FieldRenderer
          key={field.key}
          field={field}
          formData={formData}
          onColumnChange={onColumnChange}
          onJsonbChange={onJsonbChange}
          inputClassName={inputClassName}
          selectClassName={selectClassName}
          labelClassName={labelClassName}
        />
      ))}
    </div>
  )
}
