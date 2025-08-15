'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from '@/lib/validations/auth'

type ActionResult = {
  success: boolean
  message: string
  error?: string
}

export async function login(prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Validate the form data
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    const validatedData = loginSchema.parse(rawData)

    const { error } = await supabase.auth.signInWithPassword(validatedData)

    if (error) {
      return {
        success: false,
        message: 'Login failed',
        error: error.message
      }
    }

    const next = (formData.get('next') as string) || '/'

    return {
      success: true,
      message: 'Login successful'
    }

  } catch (error) {
    // Re-throw the redirect error to ensure navigation completes
    if (error && (error as any).digest === 'NEXT_REDIRECT') {
      throw error
    }

    if (error instanceof Error) {
      return {
        success: false,
        message: 'Login failed',
        error: error.message
      }
    }
    return {
      success: false,
      message: 'Login failed',
      error: 'An unexpected error occurred'
    }
  }
}

export async function signup(prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Validate the form data
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    }

    const validatedData = registerSchema.parse(rawData)

    const { error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    if (error) {
      return {
        success: false,
        message: 'Sign up failed',
        error: error.message
      }
    }

    return {
      success: true,
      message: 'Account created successfully! Please check your email to confirm your account.'
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        message: 'Sign up failed',
        error: error.message
      }
    }
    return {
      success: false,
      message: 'Sign up failed',
      error: 'An unexpected error occurred'
    }
  }
}

export async function logout(): Promise<void> {
  const supabase = await createClient()
  
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/login')
}