'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const nextParam = searchParams.get('next') || '/'
  const signupDefault = searchParams.get('signup') === '1'
  const [isSignup, setIsSignup] = useState(signupDefault)
  const [loginState, loginAction, loginPending] = useActionState(login, null)
  const [signupState, signupAction, signupPending] = useActionState(signup, null)
  const router = useRouter()

  // Handle login state changes
  useEffect(() => {
    if (loginState) {
      if (loginState.success) {
        toast.success(loginState.message)
        router.push(nextParam)
      } else {
        toast.error(loginState.error || loginState.message)
      }
    }
  }, [loginState, nextParam, router])

  // Handle signup state changes
  useEffect(() => {
    if (signupState) {
      if (signupState.success) {
        toast.success(signupState.message)
        // Switch back to login mode after successful signup
        setIsSignup(false)
      } else {
        toast.error(signupState.error || signupState.message)
      }
    }
  }, [signupState])

  const isPending = loginPending || signupPending

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {isSignup ? 'Create Account' : 'Welcome back'}
        </CardTitle>
        <CardDescription className="text-center">
          {isSignup 
            ? 'Enter your details to create your account'
            : 'Enter your credentials to access your account'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={isSignup ? signupAction : loginAction} className="space-y-4">
          <input type="hidden" name="next" value={nextParam} />
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="Enter your email"
              required 
              className="w-full"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="Enter your password"
              required 
              className="w-full"
              disabled={isPending}
            />
          </div>
          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                name="confirmPassword" 
                type="password" 
                placeholder="Confirm your password"
                required 
                className="w-full"
                disabled={isPending}
              />
            </div>
          )}
          <div className="flex flex-col space-y-2">
            <Button 
              type="submit"
              className="w-full"
              size="lg"
              disabled={isPending}
            >
              {isPending 
                ? (isSignup ? 'Creating Account...' : 'Signing In...') 
                : (isSignup ? 'Create Account' : 'Sign In')
              }
            </Button>
            <Button 
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              variant="outline" 
              className="w-full"
              size="lg"
              disabled={isPending}
            >
              {isSignup ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}