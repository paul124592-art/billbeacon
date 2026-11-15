import { daysUntil, dueLabel, dueTone, formatDate, formatMoney } from '../lib/helpers'

export default function Reminders({ bills, reminderDays, onMarkPaid, onViewBills }) {
  const active = bills.filter((b) => b.is_active)
  const groups = {
    overdue: active.filter((b) => daysUntil(b.next_due_date) < 0),
    today: active.filter((b) => daysUntil(b.next_due_date) === 0),
    soon: active.filter((b) => {
      const d = daysUntil(b.next_due_date)
      return d > 0 && d <= reminderDays
    }),
    later: active.filter((b) => {
      const d = daysUntil(b.next_due_date)
      return d > reminderDays && d <= 30
    }),
  }

  const sections = [
    { key: 'overdue', title: 'Overdue — take care of these first', tone: 'red' },
    { key: 'today', title: 'Due today', tone: 'amber' },
    {
      key: 'soon',
      title: `Due in the next ${reminderDays} day${reminderDays === 1 ? '' : 's'}`,
      tone: 'amber',
    },
    { key: 'later', title: 'Coming up in the next 30 days', tone: 'slate' },
  ]

  const total = Object.values(groups).reduce((s, g) => s + g.length, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Reminders</h2>
        <p className="text-sm text-slate-500">
          BillBeacon warns you {reminderDays} day{reminderDays === 1 ? '' : 's'} before a bill
          is due. Premium lets you change that timing.
        </p>
      </div>

      {total === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-lg font-semibold">All clear 🎉</p>
          <p className="mt-1 text-sm text-slate-500">
            Nothing is due in the next 30 days. Add a bill and reminders will show up here.
          </p>
          <button className="btn-primary mt-4" onClick={onViewBills}>
            Add a bill
          </button>
        </div>
      ) : (
        sections.map(
          ({ key, title, tone }) =>
            groups[key].length > 0 && (
              <div key={key} className="card p-5">
                <h3
                  className={`font-semibold ${
                    tone === 'red'
                      ? 'text-red-700'
                      : tone === 'amber'
                        ? 'text-amber-700'
                        : 'text-slate-700'
                  }`}
                >
                  {title} ({groups[key].length})
                </h3>
                <ul className="mt-3 divide-y divide-slate-100">
                  {groups[key]
                    .sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date))
                    .map((b) => (
                      <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                        <div>
                          <p className="font-medium">{b.name}</p>
                          <p className="text-sm text-slate-500">
                            {formatMoney(b.amount)} · due {formatDate(b.next_due_date)} ·{' '}
                            <span
                              className={
                                dueTone(b.next_due_date) === 'overdue'
                                  ? 'font-semibold text-red-600'
                                  : ''
                              }
                            >
                              {dueLabel(b.next_due_date)}
                            </span>
                          </p>
                        </div>
                        <button className="btn-primary !px-3 !py-1.5" onClick={() => onMarkPaid(b)}>
                          Mark paid
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ),
        )
      )}
    </div>
  )
}
