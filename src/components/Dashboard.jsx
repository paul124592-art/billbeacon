import {
  CATEGORIES,
  daysUntil,
  dueLabel,
  dueTone,
  formatDate,
  formatMoney,
  monthlyCost,
} from '../lib/helpers'

function toneBadge(tone, label) {
  const styles = {
    overdue: 'bg-red-100 text-red-700',
    soon: 'bg-amber-100 text-amber-800',
    ok: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${styles[tone] || styles.ok}`}>
      {label}
    </span>
  )
}

export default function Dashboard({ bills, onMarkPaid, onViewBills, onViewReminders }) {
  const active = bills.filter((b) => b.is_active)
  const monthlyTotal = active.reduce((sum, b) => sum + monthlyCost(b), 0)
  const yearlyTotal = monthlyTotal * 12

  const sorted = [...active].sort(
    (a, b) => new Date(a.next_due_date) - new Date(b.next_due_date),
  )
  const overdue = sorted.filter((b) => daysUntil(b.next_due_date) < 0)
  const due7 = sorted.filter((b) => {
    const d = daysUntil(b.next_due_date)
    return d >= 0 && d <= 7
  })
  const due30 = sorted.filter((b) => {
    const d = daysUntil(b.next_due_date)
    return d > 7 && d <= 30
  })

  const byCategory = CATEGORIES.map((c) => ({
    ...c,
    total: active
      .filter((b) => b.category === c.value)
      .reduce((sum, b) => sum + monthlyCost(b), 0),
  })).filter((c) => c.total > 0)
  const maxCat = Math.max(0, ...byCategory.map((c) => c.total))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-4">
          <p className="text-sm text-slate-500">Monthly total</p>
          <p className="mt-1 text-2xl font-bold">{formatMoney(monthlyTotal)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Yearly total</p>
          <p className="mt-1 text-2xl font-bold">{formatMoney(yearlyTotal)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Due in 7 days</p>
          <p className="mt-1 text-2xl font-bold">{due7.length}</p>
          <p className="text-xs text-slate-500">
            {formatMoney(due7.reduce((s, b) => s + Number(b.amount), 0))} coming up
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Overdue</p>
          <p className={`mt-1 text-2xl font-bold ${overdue.length ? 'text-red-600' : ''}`}>
            {overdue.length}
          </p>
          <p className="text-xs text-slate-500">
            {overdue.length ? 'Take care of these first' : 'Nothing overdue — nice.'}
          </p>
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-800">
            {overdue.length} bill{overdue.length === 1 ? ' is' : 's are'} overdue
          </p>
          <div className="mt-3 space-y-2">
            {overdue.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3">
                <div>
                  <span className="font-medium">{b.name}</span>
                  <span className="ml-2 text-sm text-slate-600">
                    {formatMoney(b.amount)} · was due {formatDate(b.next_due_date)}
                  </span>
                </div>
                <button className="btn-primary !px-3 !py-1.5" onClick={() => onMarkPaid(b)}>
                  Mark paid
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Coming up</h2>
            <button className="text-sm font-semibold text-emerald-700 hover:underline" onClick={onViewBills}>
              All bills →
            </button>
          </div>
          {sorted.length === 0 ? (
            <p className="text-sm text-slate-500">
              No bills yet. Add your first bill and BillBeacon will keep track of it for you.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {sorted.slice(0, 6).map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{b.name}</p>
                    <p className="text-sm text-slate-500">
                      {formatDate(b.next_due_date)} · {formatMoney(b.amount)} · {b.cycle}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {toneBadge(dueTone(b.next_due_date), dueLabel(b.next_due_date))}
                    <button
                      className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold hover:bg-slate-50"
                      onClick={() => onMarkPaid(b)}
                    >
                      Paid
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-4 text-lg font-semibold">Where your money goes</h2>
          {byCategory.length === 0 ? (
            <p className="text-sm text-slate-500">
              Add bills and this chart fills in — monthly spend by category.
            </p>
          ) : (
            <div className="space-y-3">
              {byCategory.map((c) => (
                <div key={c.value}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>
                      {c.icon} {c.label}
                    </span>
                    <span className="font-semibold">{formatMoney(c.total)}/mo</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(4, (c.total / maxCat) * 100)}%`,
                        backgroundColor: c.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            className="mt-5 text-sm font-semibold text-emerald-700 hover:underline"
            onClick={onViewReminders}
          >
            See all reminders →
          </button>
          {due30.length > 0 && (
            <p className="mt-2 text-sm text-slate-500">
              {due30.length} more bill{due30.length === 1 ? '' : 's'} due in the next 30 days.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
