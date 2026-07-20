import type { RegionId } from '../types/news'

export interface RegionDef {
  id: RegionId
  label: string
  color: string
}

export const REGIONS: RegionDef[] = [
  { id: 'americas', label: 'Americas', color: '#3d7a6a' },
  { id: 'europe', label: 'Europe', color: '#4a6b9c' },
  { id: 'africa', label: 'Africa', color: '#c48a3a' },
  { id: 'middle_east', label: 'Middle East', color: '#a66b4a' },
  { id: 'asia_pacific', label: 'Asia-Pacific', color: '#2f7d7a' },
  { id: 'bangladesh', label: 'Bangladesh', color: '#006a4e' },
  { id: 'global', label: 'Global', color: '#6b7280' },
]

export const REGION_MAP = Object.fromEntries(
  REGIONS.map((r) => [r.id, r]),
) as Record<RegionId, RegionDef>
