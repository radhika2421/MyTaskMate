import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { API_URL } from '../api'
import taskmateIcon from '../assets/taskmateicon.png'
import type { AuthUser } from '../types'

type AuthMode = 'signup' | 'login'
type AuthStep = 'form' | 'verify-email' | 'forgot-password' | 'reset-password'

interface PasswordFieldProps {
  label: string
  value: string
  visible: boolean
  autoComplete: string
  placeholder: string
  onChange: (value: string) => void
  onToggle: () => void
}

const PasswordField = ({ label, value, visible, autoComplete, placeholder, onChange, onToggle }: PasswordFieldProps) => (
  <label className="grid gap-2 text-sm font-bold">
    {label}
    <span className="relative">
      <input
        required
        type={visible ? 'text' : 'password'}
        minLength={8}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 px-4 py-3 pr-12 outline-none focus:border-violet-500"
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center text-slate-500 transition hover:text-violet-700"
        aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        title={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </span>
  </label>
)

const GoogleAuth = ({ mode }: { mode: AuthMode }) => {
  const [checking, setChecking] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<AuthStep>('form')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [newPasswordVisible, setNewPasswordVisible] = useState(false)
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const isSignup = mode === 'signup'

  useEffect(() => {
    setStep('form')
    setPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setOtp('')
    setPasswordVisible(false)
    setError('')
    setNotice('')
  }, [mode])

  useEffect(() => {
    const navigationState = location.state as { notice?: string } | null
    if (mode === 'login' && navigationState?.notice) setNotice(navigationState.notice)
  }, [location.key, location.state, mode])

  useEffect(() => {
    fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
      .then(async (response) => response.ok ? (await response.json()).user as AuthUser : null)
      .then((user) => { if (user) navigate('/dashboard', { replace: true }) })
      .catch(() => null)
      .finally(() => setChecking(false))
  }, [navigate])

  const post = async (path: string, body: Record<string, string>) => {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const requestError = new Error(data.message || 'Authentication failed.') as Error & { code?: string }
      requestError.code = data.code
      throw requestError
    }
    return data
  }

  const submitCredentials = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      if (isSignup) {
        await post('/api/auth/email/signup', { displayName, email, password })
        setStep('verify-email')
        setNotice(`We sent a verification code to ${email}.`)
      } else {
        await post('/api/auth/email/login', { email, password })
        navigate('/dashboard', { replace: true })
      }
    } catch (requestError) {
      const authError = requestError as Error & { code?: string }
      if (isSignup && authError.code === 'ACCOUNT_EXISTS') {
        navigate('/login', { replace: true, state: { notice: authError.message } })
        return
      }
      setError(authError.message)
      if (authError.code === 'EMAIL_NOT_VERIFIED') setStep('verify-email')
    } finally {
      setSubmitting(false)
    }
  }

  const verifyOtp = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const data = await post('/api/auth/email/verify-otp', { email, otp })
      navigate('/login', { replace: true, state: { notice: data.message || 'Email verified. Please log in.' } })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to verify code.')
    } finally {
      setSubmitting(false)
    }
  }

  const resendVerificationOtp = async () => {
    setSubmitting(true)
    setError('')
    try {
      const data = await post('/api/auth/email/resend-otp', { email })
      setNotice(data.message)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to resend code.')
    } finally {
      setSubmitting(false)
    }
  }

  const requestReset = async (event?: React.FormEvent) => {
    event?.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      const data = await post('/api/auth/email/forgot-password', { email })
      setOtp('')
      setStep('reset-password')
      setNotice(data.message)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to request a reset code.')
    } finally {
      setSubmitting(false)
    }
  }

  const submitReset = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const data = await post('/api/auth/email/reset-password', { email, otp, password: newPassword })
      setPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setOtp('')
      setStep('form')
      setNotice(data.message)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to reset password.')
    } finally {
      setSubmitting(false)
    }
  }

  const heading = step === 'verify-email'
    ? 'Verify your email'
    : step === 'forgot-password'
      ? 'Reset your password'
      : step === 'reset-password'
        ? 'Choose a new password'
        : isSignup
          ? 'Create your workspace'
          : 'Welcome back'

  const supportingCopy = step === 'verify-email'
    ? 'Enter the six-digit code from your email.'
    : step === 'forgot-password'
      ? 'Enter your account email and we will send you a reset code.'
      : step === 'reset-password'
        ? `Enter the code sent to ${email} and choose a new password.`
        : isSignup
          ? 'Sign up with email or continue with Google.'
          : 'Log in with email or your Google account.'

  return (
    <main className="grid min-h-screen place-items-center bg-[#fbf7f2] p-5 text-slate-900">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-violet-100 bg-white shadow-xl md:grid-cols-[.9fr_1.1fr]">
        <div className="bg-violet-100 p-8 sm:p-12">
          <img src={taskmateIcon} alt="MyTaskMate" className="h-14 w-14 object-contain" />
          <h1 className="mt-10 text-4xl font-black leading-tight">Plan with intention.<br />Finish with calm.</h1>
          <p className="mt-5 max-w-md leading-7 text-slate-600">Your tasks, calendar, habits, goals, and AI planner in one practical daily workspace.</p>
          <div className="mt-10 grid gap-3 text-sm font-bold text-slate-700"><p>* Rebalance plans when priorities change</p><p>* Turn goals into measurable next actions</p><p>* Learn from focus and deadline patterns</p></div>
        </div>

        <div className="flex flex-col justify-center p-8 sm:p-12">
          <p className="text-sm font-black uppercase text-violet-600">MyTaskMate</p>
          <h2 className="mt-3 text-3xl font-black">{heading}</h2>
          <p className="mt-3 text-slate-500">{supportingCopy}</p>

          {step === 'verify-email' && (
            <form onSubmit={verifyOtp} className="mt-7 grid gap-4">
              <label className="grid gap-2 text-sm font-bold">Verification code
                <input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} className="rounded-lg border border-slate-200 px-4 py-3 text-center text-2xl font-black outline-none focus:border-violet-500" placeholder="000000" />
              </label>
              {notice && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{notice}</p>}
              {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
              <button type="submit" disabled={submitting || otp.length !== 6} className="rounded-lg bg-violet-600 px-5 py-3 font-black text-white disabled:opacity-60">{submitting ? 'Verifying...' : 'Verify and continue'}</button>
              <div className="flex items-center justify-between gap-3 text-sm"><button type="button" onClick={() => setStep('form')} className="font-bold text-slate-500">Back</button><button type="button" onClick={resendVerificationOtp} disabled={submitting} className="font-black text-violet-700">Resend code</button></div>
            </form>
          )}

          {step === 'forgot-password' && (
            <form onSubmit={requestReset} className="mt-7 grid gap-4">
              <label className="grid gap-2 text-sm font-bold">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-violet-500" placeholder="you@example.com" /></label>
              {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
              <button type="submit" disabled={submitting} className="rounded-lg bg-violet-600 px-5 py-3 font-black text-white disabled:opacity-60">{submitting ? 'Sending...' : 'Send reset code'}</button>
              <button type="button" onClick={() => { setStep('form'); setError('') }} className="text-sm font-black text-violet-700">Back to login</button>
            </form>
          )}

          {step === 'reset-password' && (
            <form onSubmit={submitReset} className="mt-7 grid gap-4">
              <label className="grid gap-2 text-sm font-bold">Reset code
                <input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} className="rounded-lg border border-slate-200 px-4 py-3 text-center text-2xl font-black outline-none focus:border-violet-500" placeholder="000000" />
              </label>
              <PasswordField label="New password" value={newPassword} visible={newPasswordVisible} autoComplete="new-password" placeholder="At least 8 characters" onChange={setNewPassword} onToggle={() => setNewPasswordVisible((value) => !value)} />
              <PasswordField label="Confirm password" value={confirmPassword} visible={confirmPasswordVisible} autoComplete="new-password" placeholder="Repeat your new password" onChange={setConfirmPassword} onToggle={() => setConfirmPasswordVisible((value) => !value)} />
              {notice && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{notice}</p>}
              {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
              <button type="submit" disabled={submitting || otp.length !== 6} className="rounded-lg bg-violet-600 px-5 py-3 font-black text-white disabled:opacity-60">{submitting ? 'Resetting...' : 'Reset password'}</button>
              <div className="flex items-center justify-between gap-3 text-sm"><button type="button" onClick={() => { setStep('forgot-password'); setError(''); setNotice('') }} className="font-bold text-slate-500">Change email</button><button type="button" onClick={() => requestReset()} disabled={submitting} className="font-black text-violet-700">Resend code</button></div>
            </form>
          )}

          {step === 'form' && (
            <>
              <form onSubmit={submitCredentials} className="mt-7 grid gap-4">
                {isSignup && <label className="grid gap-2 text-sm font-bold">Name<input required autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-violet-500" placeholder="Your name" /></label>}
                <label className="grid gap-2 text-sm font-bold">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-violet-500" placeholder="you@example.com" /></label>
                <PasswordField label="Password" value={password} visible={passwordVisible} autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder="At least 8 characters" onChange={setPassword} onToggle={() => setPasswordVisible((value) => !value)} />
                {!isSignup && <button type="button" onClick={() => { setStep('forgot-password'); setError(''); setNotice('') }} className="justify-self-end text-sm font-black text-violet-700">Forgot password?</button>}
                {notice && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{notice}</p>}
                {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
                <button type="submit" disabled={submitting || checking} className="rounded-lg bg-violet-600 px-5 py-3 font-black text-white disabled:opacity-60">{submitting ? 'Please wait...' : isSignup ? 'Create account' : 'Log in'}</button>
              </form>

              <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-slate-200" /><span className="text-xs font-black uppercase text-slate-400">or</span><span className="h-px flex-1 bg-slate-200" /></div>
              <button type="button" onClick={() => { window.location.href = `${API_URL}/api/auth/google` }} disabled={checking} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-5 font-black shadow-sm transition hover:border-violet-300 hover:bg-violet-50 disabled:opacity-60"><span className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 font-black text-blue-600">G</span>Continue with Google</button>
            </>
          )}

          {step === 'form' && <p className="mt-7 text-center text-sm text-slate-500">{isSignup ? 'Already have an account?' : 'New to MyTaskMate?'}{' '}<Link className="font-black text-violet-700" to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Sign up'}</Link></p>}
        </div>
      </section>
    </main>
  )
}

export default GoogleAuth
