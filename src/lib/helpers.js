export const CATEGORIES = [
  { value: 'housing', label: 'Housing', color: '#6366f1', icon: '🏠' },
  { value: 'utilities', label: 'Utilities', color: '#f59e0b', icon: '💡' },
  { value: 'streaming', label: 'Streaming', color: '#ec4899', icon: '📺' },
  { value: 'insurance', label: 'Insurance', color: '#0ea5e9', icon: '🛡️' },
  { value: 'phone', label: 'Phone & Internet', color: '#8b5cf6', icon: '📱' },
  { value: 'fitness', label: 'Fitness', color: '#10b981', icon: '🏋️' },
  { value: 'software', label: 'Software', color: '#64748b', icon: '💻' },
  { value: 'other', label: 'Other', color: '#94a3b8', icon: '📦' },
]

export const CYCLES = [
  { value: 'weekly', label: 'Weekly', months: 0, weeks: 1 },
  { value: 'monthly', label: 'Monthly', months: 1, weeks: 0 },
  { value: 'quarterly', label: 'Every 3 months', months: 3, weeks: 0 },
  { value: 'yearly', label: 'Yearly', months: 12, weeks: 0 },
]

export const FREE_BILL_LIMIT = 10

export function categoryMeta(value) {
  return CATEGORIES.find((c) => c.value === value) || CATEGORIES[CATEGORIES.length - 1]
}

export function formatMoney(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0)
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function daysUntil(iso) {
  if (!iso) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(iso + 'T12:00:00')
  due.setHours(0, 0, 0, 0)
  return Math.round((due - today) / (1000 * 60 * 60 * 24))
}

export function dueLabel(iso) {
  const d = daysUntil(iso)
  if (d === null) return 'No due date'
  if (d < 0) return `${Math.abs(d)} day${Math.abs(d) === 1 ? '' : 's'} overdue`
  if (d === 0) return 'Due today'
  if (d === 1) return 'Due tomorrow'
  return `Due in ${d} days`
}

export function dueTone(iso) {
  const d = daysUntil(iso)
  if (d === null) return 'muted'
  if (d < 0) return 'overdue'
  if (d <= 3) return 'soon'
  return 'ok'
}

/** Advance a due date by one billing cycle. */
export function advanceDueDate(iso, cycle) {
  const def = CYCLES.find((c) => c.value === cycle) || CYCLES[1]
  const d = new Date(iso + 'T12:00:00')
  if (def.weeks) d.setDate(d.getDate() + 7 * def.weeks)
  if (def.months) d.setMonth(d.getMonth() + def.months)
  return d.toISOString().slice(0, 10)
}

/** What this bill costs per month, for totals. */
export function monthlyCost(bill) {
  const amount = Number(bill.amount) || 0
  switch (bill.cycle) {
    case 'weekly':
      return (amount * 52) / 12
    case 'quarterly':
      return amount / 3
    case 'yearly':
      return amount / 12
    default:
      return amount
  }
}

export function toCsv(rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return rows.map((r) => r.map(esc).join(',')).join('\n')
}

export function downloadFile(filename, text, type = 'text/csv') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
