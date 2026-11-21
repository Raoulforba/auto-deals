
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { apiRequest } from "../../services/api"

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          mot_de_passe: password,
        }),
      })

      sessionStorage.setItem("auto_deals_token", data.access_token)
      sessionStorage.setItem(
        "auto_deals_admin",
        JSON.stringify({
          id: data.admin_id,
          nom: data.nom,
          email: data.email,
          role: data.role,
        })
      )

      navigate("/admin/dashboard", { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-widest text-[#D4AF37]">
            AUTO DEALS
          </h1>
          <p className="text-gray-400 mt-3">
            Espace d'administration
          </p>
        </div>

        <div className="bg-[#151515] border border-[#333] rounded-2xl p-7 sm:p-9 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-2">
            Connexion
          </h2>

          <p className="text-gray-400 text-sm mb-8">
            Connectez-vous pour gérer votre plateforme.
          </p>

          {error && (
            <div className="mb-5 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Adresse e-mail
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@autodeals.com"
                autoComplete="username"
                required
                className="w-full bg-[#202020] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Mot de passe
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                  required
                  className="w-full bg-[#202020] border border-gray-700 rounded-lg px-4 py-3 pr-20 text-white outline-none focus:border-[#D4AF37]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#D4AF37]"
                >
                  {showPassword ? "Masquer" : "Afficher"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] hover:bg-yellow-500 disabled:opacity-60 text-black font-bold py-3 rounded-lg transition"
            >
              {loading ? "CONNEXION..." : "SE CONNECTER"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-xs mt-8">
            AUTO DEALS © 2026 — Administration sécurisée
          </p>
        </div>
      </div>
    </main>
  )
}

export default Login
