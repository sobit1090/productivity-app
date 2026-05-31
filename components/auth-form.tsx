'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FaGoogle } from 'react-icons/fa'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up'
  oauthError?: string
}

export function AuthForm({ mode, oauthError }: AuthFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const isSignUp = mode === 'sign-up'

  useEffect(() => {
    if (oauthError) {
      setError('Google sign-in was cancelled or failed. Please try again.')
    }
  }, [oauthError])

  const handleGoogleSignIn = async () => {
    setError(null)
    setGoogleLoading(true)
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
        errorCallbackURL: '/sign-in?error=google',
      })
      // Redirect is handled by better-auth
    } catch {
      setError('Google sign-in failed. Make sure Google OAuth is configured correctly.')
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) { setError('Email is required.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (isSignUp && !name.trim()) { setError('Name is required.'); return }

    setLoading(true)
    try {
      const { error: authError } = isSignUp
        ? await authClient.signUp.email({ email: email.trim(), password, name: name.trim(), callbackURL: '/dashboard' })
        : await authClient.signIn.email({ email: email.trim(), password, callbackURL: '/dashboard' })

      if (authError) {
        const msg = authError.message ?? ''
        if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credential')) {
          setError('Invalid email or password.')
        } else if (msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('already')) {
          setError('An account with this email already exists. Try signing in instead.')
        } else if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('no user')) {
          setError("No account found with this email. Try signing up.")
        } else {
          setError(msg || 'Something went wrong. Please try again.')
        }
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const anyLoading = loading || googleLoading

  return (
    <main className="min-h-svh bg-background flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm p-6 shadow-lg">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-lg text-foreground">StudyFlow</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignUp ? 'Sign up to start tracking your productivity' : 'Sign in to your account to continue'}
          </p>
        </div>

        {/* Google */}
        <Button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={anyLoading}
          className="w-full flex items-center justify-center gap-2 mb-4"
          variant="outline"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FaGoogle className="h-4 w-4 text-[#4285F4]" />
          )}
          {googleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
        </Button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
          </div>
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {isSignUp && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                autoComplete="name"
                disabled={anyLoading}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              disabled={anyLoading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? 'At least 8 characters' : '••••••••'}
                required
                minLength={8}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                disabled={anyLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <Button type="submit" disabled={anyLoading} className="w-full">
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Please wait...</>
            ) : isSignUp ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <Link
            href={isSignUp ? '/sign-in' : '/sign-up'}
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </Link>
        </p>
      </Card>
    </main>
  )
}
