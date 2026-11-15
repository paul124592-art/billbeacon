import { useMemo, useState } from 'react'
import { categoryMeta, formatMoney } from '../lib/helpers'

function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const startDay = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

export default function CalendarView({ bills }) {
  const today = new Date()
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const byDay = useMemo(() => {
    const map = {}
    bills
      .filter((b) => b.is_active)
      .forEach((b) => {
        const d = new Date(b.next_due_date + 'T12:00:00')
        if (d.getFullYear() === year && d.getMonth() === month) {
          const day = d.getDate()
          map[day] = map[day] || []
          map[day].push(b)
        }
      })
    return map
  }, [bills, year, month])

  const monthTotal = Object.values(byDay)
    .flat()
    .reduce((s, b) => s + Number(b.amount), 0)

  const cells = monthGrid(year, month)
  const monthName = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth()

  const shift = (delta) => setCursor(new Date(year, month + delta, 1))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{monthName}</h2>
          <p className="text-sm text-slate-500">
            {formatMoney(monthTotal)} due this month · {Object.values(byDay).flat().length} bills
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => shift(-1)}>
            ← Prev
          </button>
          {!isCurrentMonth && (
            <button
              className="btn-secondary"
              onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
            >
              Today
            </button>
          )}
          <button className="btn-secondary" onClick={() => shift(1)}>
            Next →
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-500">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dayBills = day ? byDay[day] || [] : []
            const isToday = isCurrentMonth && day === today.getDate()
            return (
              <div
                key={i}
                className={`min-h-[84px] border-b border-r border-slate-100 p-1.5 align-top ${
                  day ? '' : 'bg-slate-50'
                } ${isToday ? 'bg-emerald-50' : ''}`}
              >
                {day && (
                  <>
                    <p
                      className={`text-xs font-semibold ${
                        isToday ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {day}
                    </p>
                    <div className="mt-1 space-y-1">
                      {dayBills.slice(0, 3).map((b) => (
                        <div
                          key={b.id}
                          className="truncate rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
                          style={{ backgroundColor: categoryMeta(b.category).color }}
                          title={`${b.name} — ${formatMoney(b.amount)}`}
                        >
                          {b.name} · {formatMoney(b.amount)}
                        </div>
                      ))}
                      {dayBills.length > 3 && (
                        <p className="px-1 text-[11px] text-slate-500">
                          +{dayBills.length - 3} more
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Only the next due date of each bill shows here. Mark a bill paid and its next date
        moves forward automatically.
      </p>
    </div>
  )
}
