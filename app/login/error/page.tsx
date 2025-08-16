'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Home, LogIn } from 'lucide-react'

export default function ErrorPage() {
  const [errorTitle, setErrorTitle] = useState('Authentication Error')
  const [errorDescription, setErrorDescription] = useState('Something went wrong with the authentication process.')
  
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlError = searchParams.get('error')
    const urlDescription = searchParams.get('description')
    
    if (urlError && urlDescription) {
      const decodedDescription = decodeURIComponent(urlDescription)
      
      if (urlError === 'auth_error') {
        setErrorTitle('Authentication Error')
        setErrorDescription(decodedDescription)
      } else if (urlError === 'invalid_request') {
        setErrorTitle('Invalid Request')
        setErrorDescription(decodedDescription)
      } else {
        setErrorTitle('Authentication Error')
        setErrorDescription(decodedDescription)
      }
    }
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold">{errorTitle}</CardTitle>
          <CardDescription className="text-center">
            {errorDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => window.location.href = '/login'} 
              className="w-full"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Try Signing In
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'} 
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>
          
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Need help?{' '}
              <a href="/contact" className="text-blue-600 hover:underline">
                Contact Support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
