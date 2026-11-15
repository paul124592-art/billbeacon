import { useState } from 'react'
import {
  CATEGORIES,
  downloadFile,
  formatDate,
  formatMoney,
  monthlyCost,
  toCsv,
} from '../lib/helpers'

const DEMO_BILLS = [
  {
    name: 'Netflix',
    amount: 15.49,
    cycle: 'monthly',
    next_due_date: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
    category: 'streaming',
    payment_method: '',
    notes: 'Standard plan',
    url: 'https://netflix.com',
  },
  {
    name: 'Electric bill',
    amount: 86.2,
    cycle: 'monthly',
    next_due_date: new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 10),
    category: 'utilities',
    payment_method: '',
    notes: '',
    url: '',
  },
  {
    name: 'Car insurance',
    amount: 142.0,
    cycle: 'monthly',
    next_due_date: new Date(Date.now() + 16 * 86400000).toISOString().slice(0, 10),
    category: 'insurance',
    payment_method: '',
    notes: '',
    url: '',
  },
  {
    name: 'Gym membership',
    amount: 29.99,
    cycle: 'monthly',
    next_due_date: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
    category: 'fitness',
    payment_method: '',
    notes: '',
    url: '',
  },
  {
    name: 'Phone plan',
    amount: 65.0,
    cycle: 'monthly',
    next_due_date: new Date(Date.now() + 26 * 86400000).toISOString().slice(0, 10),
    category: 'phone',
    payment_method: '',
    notes: '',
    url: '',
  },
]

export default function Settings({
  user,
  profile,
  bills,
  payments,
  onUpdateProfile,
  onSeedDemo,
  onSignOut,
}) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const paymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK

  const isPremium = profile?.is_premium
  const reminderDays = profile?.reminder_days ?? 3

  const saveReminderDays = async (days) => {
    setBusy(true)
    await onUpdateProfile({ reminder_days: days })
    setBusy(false)
    setMessage(`Reminders will now warn you ${days} day${days === 1 ? '' : 's'} before a bill is due.`)
  }

  const activatePremium = async () => {
    setBusy(true)
    await onUpdateProfile({ is_premium: true })
    setBusy(false)
    setMessage('Premium is on — unlimited bills, custom reminders, and CSV export unlocked. Welcome aboard!')
  }

  const exportCsv = () => {
    const rows = [
      ['Name', 'Amount', 'Cycle', 'Next due date', 'Category', 'Payment method', 'Status'],
      ...bills.map((b) => [
        b.name,
        b.amount,
        b.cycle,
        b.next_due_date,
        CATEGORIES.find((c) => c.value === b.category)?.label || b.category,
        b.payment_method || '',
        b.is_active ? 'Active' : 'Paused',
      ]),
    ]
    downloadFile('billbeacon-bills.csv', toCsv(rows))
    setMessage('Your bills were downloaded as a CSV file.')
  }

  const seed = async () => {
    setBusy(true)
    await onSeedDemo(DEMO_BILLS)
    setBusy(false)
    setMessage('Added 5 demo bills. Delete any of them from the Bills tab whenever you like.')
  }

  const monthlyTotal = bills
    .filter((b) => b.is_active)
    .reduce((s, b) => s + monthlyCost(b), 0)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-xl font-bold">Settings</h2>

      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
      )}

      <div className="card p-5">
        <h3 className="font-semibold">Account</h3>
        <p className="mt-1 text-sm text-slate-600">Signed in as {user?.email}</p>
        <button className="btn-secondary mt-3" onClick={onSignOut}>
          Sign out
        </button>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold">Your plan</h3>
        {isPremium ? (
          <p className="mt-1 text-sm text-slate-600">
            You&apos;re on <span className="font-semibold text-emerald-700">Premium</span> —
            unlimited bills, custom reminders, spending insights, and CSV export. Thanks for
            supporting BillBeacon.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate-600">
              You&apos;re on the <span className="font-semibold">Free</span> plan — up to 10
              bills, standard 3-day reminders. Premium is $4/month for unlimited bills, custom
              reminder timing, spending insights, and CSV export.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                className="btn-primary"
                href={paymentLink}
                target="_blank"
                rel="noreferrer"
              >
                Upgrade to Premium — $4/mo
              </a>
              <button className="btn-secondary" onClick={activatePremium} disabled={busy}>
                I&apos;ve upgraded — unlock Premium
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              After paying, come back here and tap &ldquo;I&apos;ve upgraded&rdquo; to unlock
              Premium on this account.
            </p>
          </>
        )}
      </div>

      <div className="card p-5">
        <h3 className="font-semibold">Reminders</h3>
        <p className="mt-1 text-sm text-slate-600">
          Warn me this many days before a bill is due:
        </p>
        <div className="mt-3 flex gap-2">
          {[1, 3, 7, 14].map((d) => (
            <button
              key={d}
              onClick={() => saveReminderDays(d)}
              disabled={busy || (!isPremium && d !== 3)}
              title={!isPremium && d !== 3 ? 'Premium only' : ''}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                reminderDays === d
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {d} day{d === 1 ? '' : 's'}
            </button>
          ))}
        </div>
        {!isPremium && (
          <p className="mt-2 text-xs text-slate-500">
            Custom reminder timing is a Premium feature — the free plan warns you 3 days ahead.
          </p>
        )}
      </div>

      <div className="card p-5">
        <h3 className="font-semibold">Your data</h3>
        <p className="mt-1 text-sm text-slate-600">
          {bills.length} bill{bills.length === 1 ? '' : 's'} · {payments.length} payment
          {payments.length === 1 ? '' : 's'} recorded ·{' '}
          {formatMoney(monthlyTotal)} per month in active bills
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={exportCsv} disabled={!isPremium}>
            Export bills as CSV
          </button>
          <button className="btn-secondary" onClick={seed} disabled={busy}>
            Add 5 demo bills
          </button>
        </div>
        {!isPremium && (
          <p className="mt-2 text-xs text-slate-500">
            CSV export is a Premium feature.
          </p>
        )}
        {payments.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold">Recent payments</h4>
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {payments.slice(0, 5).map((p) => {
                const bill = bills.find((b) => b.id === p.bill_id)
                return (
                  <li key={p.id} className="flex justify-between py-1.5">
                    <span>{bill?.name || 'Deleted bill'}</span>
                    <span className="text-slate-500">
                      {formatMoney(p.amount)} · {formatDate(p.paid_date)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
