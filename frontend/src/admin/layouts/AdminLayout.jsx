
import { useEffect, useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { apiRequest } from "../../services/api"

function AdminLayout() {
  const navigate = useNavigate()
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest("/auth/me")
      .then((data) => setAdmin(data))
      .catch(() => {
        sessionStorage.removeItem("auto_deals_token")
        sessionStorage.removeItem("auto_deals_admin")
        navigate("/admin/login", { replace: true })
      })
      .finally(() => setLoading(false))
  }, [navigate])

  const logout = () => {
    sessionStorage.removeItem("auto_deals_token")
    sessionStorage.removeItem("auto_deals_admin")
    navigate("/admin/login", { replace: true })
  }

  if (loading || !admin) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center text-[#D4AF37]">
        Vérification de votre session...
      </div>
    )
  }

  const peutModifier =
    admin.role === "SUPER_ADMIN" ||
    admin.role === "ADMINISTRATEUR"

  const lienStyle = ({ isActive }) =>
    `block rounded-lg p-3 ${
      isActive
        ? "bg-[#D4AF37] text-black font-bold"
        : "text-gray-300 hover:bg-[#222]"
    }`

  return (
    <div className="min-h-screen bg-[#080808] md:flex">
      <aside className="w-full md:w-64 bg-[#121212] border-b md:border-b-0 md:border-r border-gray-800 p-6">
        <h1 className="text-2xl font-black text-[#D4AF37]">
          AUTO DEALS
        </h1>

        <p className="text-gray-500 text-xs mt-2">
          ADMINISTRATION
        </p>

        <nav className="mt-10 space-y-3">
          <NavLink to="/admin/dashboard" className={lienStyle}>
            Tableau de bord
          </NavLink>

          <NavLink to="/admin/vehicles" className={lienStyle}>
            Véhicules
          </NavLink>
{peutModifier && (
  <NavLink to="/admin/sales" className={lienStyle}>
    Ventes
  </NavLink>
)}

          {peutModifier && (
            <NavLink to="/admin/add-vehicle" className={lienStyle}>
              Ajouter un véhicule
            </NavLink>
          )}

          <NavLink to="/admin/activities" className={lienStyle}>
            Historique des activités
          </NavLink>

          {admin.role === "SUPER_ADMIN" && (
            <NavLink to="/admin/administrateurs" className={lienStyle}>
              Gestion des administrateurs
            </NavLink>
          )}
        </nav>

        <div className="mt-10 border-t border-gray-800 pt-5">
          <p className="text-white font-semibold">{admin.nom}</p>

          <p className="text-gray-500 text-xs break-all">
            {admin.email}
          </p>

          <p className="text-[#D4AF37] text-xs mt-2">
            {admin.role}
          </p>

          <button
            onClick={logout}
            className="mt-5 w-full text-left text-red-400 hover:text-red-300"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10">
  <Outlet context={{ admin }} />
</main>
    </div>
  )
}

export default AdminLayout
