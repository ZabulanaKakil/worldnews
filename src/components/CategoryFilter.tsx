import type { CSSProperties } from 'react'
import { CATEGORIES } from '../config/categories'
import type { CategoryId } from '../types/news'

interface CategoryFilterProps {
  value: CategoryId | 'all'
  onChange: (value: CategoryId | 'all') => void
}

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <div className="filter-row" role="group" aria-label="Filter by category">
      <button
        type="button"
        className={value === 'all' ? 'chip active' : 'chip'}
        onClick={() => onChange('all')}
      >
        All topics
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          type="button"
          className={value === cat.id ? 'chip active' : 'chip'}
          onClick={() => onChange(cat.id)}
          style={{ '--chip-accent': cat.color } as CSSProperties}
        >
          {cat.shortLabel}
        </button>
      ))}
    </div>
  )
}
