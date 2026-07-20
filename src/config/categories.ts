import type { CategoryId } from '../types/news'

export interface CategoryDef {
  id: CategoryId
  label: string
  shortLabel: string
  color: string
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'war_conflict', label: 'War & Conflict', shortLabel: 'War', color: '#c45c4a' },
  { id: 'diplomacy', label: 'Diplomacy & Geopolitics', shortLabel: 'Diplomacy', color: '#3d6b8c' },
  { id: 'weather_climate', label: 'Weather & Climate', shortLabel: 'Weather', color: '#4a8f9c' },
  { id: 'technology', label: 'Technology', shortLabel: 'Tech', color: '#5b7c99' },
  { id: 'creativity_arts', label: 'Creativity, Arts & Culture', shortLabel: 'Arts', color: '#a66b4a' },
  { id: 'economy_business', label: 'Economy & Business', shortLabel: 'Economy', color: '#6b8f5a' },
  { id: 'environment', label: 'Environment & Energy', shortLabel: 'Environment', color: '#3f8f6b' },
  { id: 'world_politics', label: 'World Politics', shortLabel: 'Politics', color: '#6b5b8c' },
  { id: 'sports', label: 'Sports', shortLabel: 'Sports', color: '#c48a3a' },
  { id: 'cybersecurity', label: 'Cybersecurity', shortLabel: 'Cyber', color: '#4a6b7c' },
  { id: 'ai_innovation', label: 'AI & Innovation', shortLabel: 'AI', color: '#2f7d7a' },
  { id: 'disasters', label: 'Disasters & Emergencies', shortLabel: 'Disasters', color: '#b05a4a' },
]

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, CategoryDef>
