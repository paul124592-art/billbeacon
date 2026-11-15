import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import { advanceDueDate, daysUntil } from './lib/helpers'
import Dashboard from './components/Dashboard'
import Bills from './components/Bills'
import CalendarView from './components/CalendarView'
import Reminders from './components/Reminders'
import Settings from './components/Settings'

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'bills', label: 'Bills', icon: '🧾' },
  { key: 'calendar', label: 'Calendar', icon: '📅' },
  { key: 'reminders', label: 'Reminders', icon: '🔔' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
]

function Landing({ onShowAuth }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <p className="text-xl font-extrabold">
          <span className="text-emerald-600">●</span> BillBeacon
        </p>
        <button className="btn-primary" onClick={onShowAuth}>
          Get started free
        </button>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16">
        <section className="py-12 text-center sm:py-20">
          <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Never get surprised by a renewal again.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            BillBeacon tracks every bill and subscription in one place, shows what you owe and
            when, and warns you before anything renews.
          </p>
          <button className="btn-primary mt-8 !px-6 !py-3 !text-base" onClick={onShowAuth}>
            Start tracking — it&apos;s free
          </button>
          <p className="mt-3 text-sm text-slate-500">
            Free for up to 10 bills · Premium $4/month for unlimited
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: '👀',
              title: 'See everything you owe',
              text: 'One dashboard with your monthly total, yearly total, and what is due next.',
            },
            {
              icon: '🔔',
              title: 'Get warned before it renews',
              text: 'Reminders 3 days ahead on the free plan — custom timing on Premium.',
            },
            {
              icon: '✅',
              title: 'Mark paid, move on',
              text: 'One tap marks a bill paid and rolls its next due date forward automatically.',
            },
          ].map((f) => (
            <div key={f.title} className="card p-5">
              <p className="text-2xl">{f.icon}</p>
              <h3 className="mt-2 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.text}</p>
            </div>
          ))}
        </section>

        <section className="card mx-auto mt-12 max-w-2xl p-6 text-center">
          <h2 className="text-xl font-bold">Free vs Premium</h2>
          <div className="mt-4 grid gap-4 text-left sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold">Free — $0</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                <li>✓ Up to 10 bills</li>
                <li>✓ 3-day reminders</li>
                <li>✓ Calendar view</li>
                <li>✓ Payment history</li>
              </ul>
            </div>
            <div className="rounded-xl border-2 border-emerald-500 p-4">
              <p className="font-semibold text-emerald-700">Premium — $4/month</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                <li>✓ Unlimited bills</li>
                <li>✓ Custom reminder timing</li>
                <li>✓ Spending insights by category</li>
                <li>✓ CSV export</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function AuthPanel({ onClose }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!email.includes('@')) return setError('Enter a valid email address.')
    if (password.length < 6) return setError('Password needs at least 6 characters.')
    setBusy(true)
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Account created! Check your email to confirm, then sign in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setBusy(false)
  }

  const google = async () => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h2>
          <button className="text-slate-400 hover:text-slate-600" onClick={onClose}>
            ✕
          </button>
        </div>
        <button className="btn-secondary mt-4 w-full" onClick={google}>
          Continue with Google
        </button>
        <p className="my-4 text-center text-xs text-slate-400">or with email</p>
        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {message && (
          <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {message}
          </p>
        )}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <button
          className="mt-4 w-full text-center text-sm font-semibold text-emerald-700 hover:underline"
          onClick={() => {
            setMode(mode === 'signup' ? 'signin' : 'signup')
            setError('')
            setMessage('')
          }}
        >
          {mode === 'signup'
            ? 'Already have an account? Sign in'
            : "Don't have an account? Create one"}
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [bills, setBills] = useState([])
  const [payments, setPayments] = useState([])
  const [view, setView] = useState('dashboard')
  const [showAuth, setShowAuth] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadAll = useCallback(async (userId) => {
    const [{ data: profileRows }, { data: billRows }, { data: paymentRows }] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase
          .from('bills')
          .select('*')
          .eq('user_id', userId)
          .order('next_due_date', { ascending: true }),
        supabase
          .from('payments')
          .select('*')
          .eq('user_id', userId)
          .order('paid_date', { ascending: false })
          .limit(50),
      ])
    setProfile(profileRows || null)
    setBills(billRows || [])
    setPayments(paymentRows || [])
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const sessionUser = data.session?.user || null
      setUser(sessionUser)
      if (sessionUser) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .maybeSingle()
        if (!existing) {
          await supabase
            .from('profiles')
            .insert({ id: sessionUser.id, email: sessionUser.email })
        }
        await loadAll(sessionUser.id)
      }
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user || null
      setUser(sessionUser)
      if (sessionUser) await loadAll(sessionUser.id)
      else {
        setProfile(null)
        setBills([])
        setPayments([])
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [loadAll])

  const refreshBills = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', user.id)
      .order('next_due_date', { ascending: true })
    setBills(data || [])
  }, [user])

  const saveBill = async (data, editing) => {
    if (!user) return
    const payload = { ...data, user_id: user.id }
    if (editing) {
      const { error } = await supabase.from('bills').update(payload).eq('id', editing.id)
      if (error) return setLoadError(error.message)
    } else {
      const { error } = await supabase.from('bills').insert(payload)
      if (error) return setLoadError(error.message)
    }
    setLoadError('')
    await refreshBills()
  }

  const deleteBill = async (bill) => {
    await supabase.from('bills').delete().eq('id', bill.id)
    await refreshBills()
  }

  const toggleActive = async (bill) => {
    await supabase
      .from('bills')
      .update({ is_active: !bill.is_active })
      .eq('id', bill.id)
    await refreshBills()
  }

  const markPaid = async (bill) => {
    if (!user) return
    const today = new Date().toISOString().slice(0, 10)
    const next = advanceDueDate(bill.next_due_date, bill.cycle)
    const { error: payError } = await supabase.from('payments').insert({
      bill_id: bill.id,
      user_id: user.id,
      amount: bill.amount,
      paid_date: today,
      due_date: bill.next_due_date,
    })
    if (payError) return setLoadError(payError.message)
    const { error: billError } = await supabase
      .from('bills')
      .update({ next_due_date: next })
      .eq('id', bill.id)
    if (billError) return setLoadError(billError.message)
    setLoadError('')
    await refreshBills()
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('paid_date', { ascending: false })
      .limit(50)
    setPayments(data || [])
  }

  const updateProfile = async (patch) => {
    if (!user) return
    await supabase.from('profiles').update(patch).eq('id', user.id)
    setProfile((p) => ({ ...p, ...patch }))
  }

  const seedDemo = async (demoBills) => {
    if (!user) return
    const rows = demoBills.map((b) => ({ ...b, user_id: user.id }))
    await supabase.from('bills').insert(rows)
    await refreshBills()
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setView('dashboard')
  }

  const reminderCount = useMemo(() => {
    const days = profile?.reminder_days ?? 3
    return bills.filter((b) => {
      if (!b.is_active) return false
      const d = daysUntil(b.next_due_date)
      return d <= days
    }).length
  }, [bills, profile])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Loading BillBeacon…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <Landing onShowAuth={() => setShowAuth(true)} />
        {showAuth && <AuthPanel onClose={() => setShowAuth(false)} />}
      </>
    )
  }

  const paymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK
  const goUpgrade = () => {
    if (paymentLink) window.open(paymentLink, '_blank', 'noreferrer')
    setView('settings')
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <button
            className="text-lg font-extrabold"
            onClick={() => setView('dashboard')}
          >
            <span className="text-emerald-600">●</span> BillBeacon
            {profile?.is_premium && (
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                Premium
              </span>
            )}
          </button>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <button
                key={n.key}
                onClick={() => setView(n.key)}
                className={`relative whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${
                  view === n.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {n.icon} {n.label}
                {n.key === 'reminders' && reminderCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
                    {reminderCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {loadError && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {loadError}
          </p>
        )}
        {view === 'dashboard' && (
          <Dashboard
            bills={bills}
            onMarkPaid={markPaid}
            onViewBills={() => setView('bills')}
            onViewReminders={() => setView('reminders')}
          />
        )}
        {view === 'bills' && (
          <Bills
            bills={bills}
            isPremium={!!profile?.is_premium}
            onSave={saveBill}
            onDelete={deleteBill}
            onMarkPaid={markPaid}
            onToggleActive={toggleActive}
            onUpgrade={goUpgrade}
          />
        )}
        {view === 'calendar' && <CalendarView bills={bills} />}
        {view === 'reminders' && (
          <Reminders
            bills={bills}
            reminderDays={profile?.reminder_days ?? 3}
            onMarkPaid={markPaid}
            onViewBills={() => setView('bills')}
          />
        )}
        {view === 'settings' && (
          <Settings
            user={user}
            profile={profile}
            bills={bills}
            payments={payments}
            onUpdateProfile={updateProfile}
            onSeedDemo={seedDemo}
            onSignOut={signOut}
          />
        )}
      </main>
    </div>
  )
}
