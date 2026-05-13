import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Geçersiz kullanıcı adı veya şifre.'
          : 'Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-bg-card border border-border-subtle rounded-card p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src="/building-logo.svg" alt="Akıllı Bina" className="w-12 h-12" />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-lg font-semibold text-text-primary mb-1">
              IoT Akıllı Bina
            </h1>
            <p className="text-sm text-text-secondary">
              Bina Takip ve Yönetim Sistemi
            </p>
          </div>

          {/* Demo Credentials Info */}
          <div className="bg-accent/10 border border-accent/20 rounded-btn px-3 py-2.5 mb-5">
            <p className="text-[10px] font-semibold text-accent mb-1">Demo Giriş Bilgileri</p>
            <p className="text-xs text-text-secondary">
              E-posta: <span className="font-mono text-text-primary">admin@smartbuilding.io</span>
            </p>
            <p className="text-xs text-text-secondary">
              Şifre: <span className="font-mono text-text-primary">demo1234</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-medium text-text-secondary">
                Kullanıcı Adı
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@smartbuilding.io"
                required
                autoComplete="email"
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-medium text-text-secondary">
                Şifre
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-btn px-3 py-2">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-accent text-white text-sm font-medium rounded-btn flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Giriş yapılıyor…</span>
                </>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-secondary mt-6">
          IoT Akıllı Bina Takip Sistemi · Demo Sürümü
        </p>
      </div>
    </div>
  )
}
