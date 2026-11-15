import { useMemo, useState } from 'react'
import {
  CATEGORIES,
  CYCLES,
  FREE_BILL_LIMIT,
  categoryMeta,
  dueLabel,
  dueTone,
  formatDate,
  formatMoney,
} from '../lib/helpers'

const EMPTY_FORM = {
  name: '',
  amount: '',
  cycle: 'monthly',
  next_due_date: new Date().toISOString().slice(0, 10),
  category: 'other',
  payment_method: '',
  notes: '',
  url: '',
}

function BillForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const [error, setError] = useState('')

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Give the bill a name.')
    if (!form.amount || Number(form.amount) <= 0)
      return setError('Enter an amount greater than zero.')
    if (!form.next_due_date) return setError('Pick the next due date.')
    setError('')
    onSave({ ...form, amount: Number(form.amount) })
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <h3 className="text-lg font-semibold">{initial ? 'Edit bill' : 'Add a bill'}</h3>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="bill-name">Name</label>
          <input
            id="bill-name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Netflix, Electric bill"
          />
        </div>
        <div>
          <label htmlFor="bill-amount">Amount ($)</label>
          <input
            id="bill-amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            placeholder="15.49"
          />
        </div>
        <div>
          <label htmlFor="bill-cycle">Billing cycle</label>
          <select id="bill-cycle" value={form.cycle} onChange={(e) => set('cycle', e.target.value)}>
            {CYCLES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="bill-due">Next due date</label>
          <input
            id="bill-due"
            type="date"
            value={form.next_due_date}
            onChange={(e) => set('next_due_date', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="bill-category">Category</label>
          <select
            id="bill-category"
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="bill-method">Payment method (optional)</label>
          <input
            id="bill-method"
            value={form.payment_method}
            onChange={(e) => set('payment_method', e.target.value)}
            placeholder="e.g. Chime Visa •• 1234"
          />
        </div>
        <div>
          <label htmlFor="bill-url">Website (optional)</label>
          <input
            id="bill-url"
            type="url"
            value={form.url}
            onChange={(e) => set('url', e.target.value)}
            placeholder="https://netflix.com"
          />
        </div>
        <div>
          <label htmlFor="bill-notes">Notes (optional)</label>
          <input
            id="bill-notes"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="e.g. renews at $99/year"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add bill'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function Bills({
  bills,
  isPremium,
  onSave,
  onDelete,
  onMarkPaid,
  onToggleActive,
  onUpgrade,
}) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const activeCount = bills.filter((b) => b.is_active).length
  const atLimit = !isPremium && activeCount >= FREE_BILL_LIMIT

  const visible = useMemo(() => {
    let list = [...bills].sort(
      (a, b) => new Date(a.next_due_date) - new Date(b.next_due_date),
    )
    if (filter === 'active') list = list.filter((b) => b.is_active)
    if (filter === 'paused') list = list.filter((b) => !b.is_active)
    if (filter === 'overdue')
      list = list.filter((b) => b.is_active && dueTone(b.next_due_date) === 'overdue')
    if (search.trim())
      list = list.filter((b) => b.name.toLowerCase().includes(search.trim().toLowerCase()))
    return list
  }, [bills, filter, search])

  const save = async (data) => {
    setSaving(true)
    await onSave(data, editing)
    setSaving(false)
    setShowForm(false)
    setEditing(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Your bills</h2>
          <p className="text-sm text-slate-500">
            {activeCount} active · {bills.length - activeCount} paused
            {!isPremium && ` · Free plan: ${activeCount}/${FREE_BILL_LIMIT} bills`}
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null)
            setShowForm(true)
          }}
          disabled={atLimit}
          title={atLimit ? 'Free plan limit reached — upgrade for unlimited bills' : ''}
        >
          + Add bill
        </button>
      </div>

      {atLimit && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="font-semibold text-amber-900">
            You&apos;ve reached the free plan limit of {FREE_BILL_LIMIT} bills.
          </p>
          <p className="mt-1 text-amber-800">
            Upgrade to Premium ($4/month) for unlimited bills, custom reminders, spending
            insights, and CSV export.
          </p>
          <button className="btn-primary mt-3" onClick={onUpgrade}>
            Upgrade to Premium — $4/mo
          </button>
        </div>
      )}

      {(showForm || editing) && (
        <BillForm
          initial={editing}
          onSave={save}
          onCancel={() => {
            setShowForm(false)
            setEditing(null)
          }}
          saving={saving}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search bills…"
          className="!w-56"
        />
        {[
          ['all', 'All'],
          ['active', 'Active'],
          ['overdue', 'Overdue'],
          ['paused', 'Paused'],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              filter === value
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-lg font-semibold">No bills here yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Add a bill above — Netflix, rent, electric, anything — and BillBeacon will watch
            its due date for you.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((b) => {
            const meta = categoryMeta(b.category)
            const tone = dueTone(b.next_due_date)
            return (
              <li key={b.id} className={`card p-4 ${!b.is_active ? 'opacity-60' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                      style={{ backgroundColor: `${meta.color}1f` }}
                    >
                      {meta.icon}
                    </span>
                    <div>
                      <p className="font-semibold">
                        {b.name}{' '}
                        <span className="text-sm font-normal text-slate-500">
                          · {meta.label} · {b.cycle}
                        </span>
                      </p>
                      <p className="text-sm text-slate-600">
                        {formatMoney(b.amount)} · due {formatDate(b.next_due_date)} ·{' '}
                        <span
                          className={
                            tone === 'overdue'
                              ? 'font-semibold text-red-600'
                              : tone === 'soon'
                                ? 'font-semibold text-amber-700'
                                : ''
                          }
                        >
                          {dueLabel(b.next_due_date)}
                        </span>
                      </p>
                      {b.payment_method && (
                        <p className="text-xs text-slate-500">Paid with {b.payment_method}</p>
                      )}
                      {b.notes && <p className="text-xs text-slate-500">{b.notes}</p>}
                      {b.url && (
                        <a
                          href={b.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-emerald-700 hover:underline"
                        >
                          Manage at {b.url.replace(/^https?:\/\//, '').split('/')[0]} ↗
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {b.is_active && (
                      <button
                        className="btn-primary !px-3 !py-1.5"
                        onClick={() => onMarkPaid(b)}
                      >
                        Mark paid
                      </button>
                    )}
                    <button
                      className="btn-secondary !px-3 !py-1.5"
                      onClick={() => {
                        setEditing(b)
                        setShowForm(false)
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-secondary !px-3 !py-1.5"
                      onClick={() => onToggleActive(b)}
                    >
                      {b.is_active ? 'Pause' : 'Resume'}
                    </button>
                    {confirmDelete === b.id ? (
                      <>
                        <button className="btn-danger" onClick={() => onDelete(b)}>
                          Confirm delete
                        </button>
                        <button
                          className="btn-secondary !px-3 !py-1.5"
                          onClick={() => setConfirmDelete(null)}
                        >
                          Keep it
                        </button>
                      </>
                    ) : (
                      <button className="btn-danger" onClick={() => setConfirmDelete(b.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
