import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { NamedCount } from '../../lib/news/stats'

interface CategoryChartProps {
  data: NamedCount[]
}

export function CategoryChart({ data }: CategoryChartProps) {
  if (data.length === 0) {
    return <p className="chart-empty">No category data yet</p>
  }

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={52}
            outerRadius={84}
            paddingAngle={2}
            animationDuration={700}
          >
            {data.map((entry) => (
              <Cell key={entry.id} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              color: 'var(--ink)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="chart-legend">
        {data.map((d) => (
          <li key={d.id}>
            <span className="swatch" style={{ background: d.color }} />
            {d.name}
            <strong>{d.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}
