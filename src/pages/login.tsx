import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart3, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      toast.error('Please enter username and password')
      return
    }

    setIsLoading(true)

    const success = await login(username, password)
    setIsLoading(false)

    if (success) {
      toast.success('Welcome back!')
      navigate('/')
    } else {
      toast.error('Invalid username or password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container shadow-lg shadow-primary-container/20">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-headline font-bold text-primary">Prio Dashboard</h1>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Sales Analytics</p>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="h-10 w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 text-sm outline-none placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary text-on-surface transition-all"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-10 w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 pr-10 text-sm outline-none placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary text-on-surface transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            <div className="mt-4 text-center text-xs text-on-surface-variant/60">
              Default: admin / admin123
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
