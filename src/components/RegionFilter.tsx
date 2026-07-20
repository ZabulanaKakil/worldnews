import type { CSSProperties } from 'react'
import { REGIONS } from '../config/regions'
import type { RegionId } from '../types/news'

interface RegionFilterProps {
  value: RegionId | 'all'
  onChange: (value: RegionId | 'all') => void
}

export function RegionFilter({ value, onChange }: RegionFilterProps) {
  return (
    <div className="filter-row regions" role="group" aria-label="Filter by region">
      <button
        type="button"
        className={value === 'all' ? 'chip active' : 'chip'}
        onClick={() => onChange('all')}
      >
        All regions
      </button>
      {REGIONS.map((region) => (
        <button
          key={region.id}
          type="button"
          className={value === region.id ? 'chip active' : 'chip'}
          onClick={() => onChange(region.id)}
          style={{ '--chip-accent': region.color } as CSSProperties}
        >
          {region.label}
        </button>
      ))}
    </div>
  )
}
