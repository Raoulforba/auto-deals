
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { apiRequest } from "../../services/api"

const API_URL = "http://127.0.0.1:8000"

function Vehicles() {
  const navigate = useNavigate()

  const [vehicles, setVehicles] = useState([])
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statutEnCours, setStatutEnCours] = useState(null)

  const peutModifier =
    admin?.role === "SUPER_ADMIN" ||
    admin?.role === "ADMINISTRATEUR"

  const chargerVehicules = async () => {
    setLoading(true)
    setError("")

    try {
      const [data, utilisateur] = await Promise.all([
        apiRequest("/vehicules/"),
        apiRequest("/auth/me"),
      ])

      setVehicles(data)
      setAdmin(utilisateur)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    chargerVehicules()
  }, [])

  const changerStatut = async (vehicle, nouveauStatut) => {
    if (!peutModifier || vehicle.statut === nouveauStatut) return

    const confirmation = window.confirm(
      `Voulez-vous changer le statut de ${vehicle.marque} ${vehicle.modele} en ${nouveauStatut} ?`
    )

    if (!confirmation) return

    setStatutEnCours(vehicle.id)
    setError("")

    try {
      const vehiculeModifie = await apiRequest(
        `/vehicules/${vehicle.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            statut: nouveauStatut,
          }),
        }
      )

      setVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicle.id ? vehiculeModifie : v
        )
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setStatutEnCours(null)
    }
  }

  const supprimerVehicule = async (id) => {
    if (!peutModifier) return

    const confirmation = window.confirm(
      "Voulez-vous vraiment supprimer ce véhicule ?"
    )

    if (!confirmation) return

    try {
      await apiRequest(`/vehicules/${id}`, {
        method: "DELETE",
      })

      setVehicles((prev) => prev.filter((v) => v.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  const formaterPrix = (prix) =>
    Number(prix).toLocaleString("fr-FR") + " FCFA"

  const obtenirImage = (imageUrl) => {
    if (!imageUrl) return null

    return imageUrl.startsWith("http")
      ? imageUrl
      : `${API_URL}${imageUrl}`
  }

  return (
    <section>
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-[#D4AF37] text-sm font-semibold">
            GESTION DU STOCK
          </p>

          <h1 className="text-3xl font-bold text-white mt-2">
            Nos véhicules
          </h1>

          <p className="text-gray-400 mt-2">
            {peutModifier
              ? "Gérez les annonces de votre plateforme."
              : "Consultez les véhicules enregistrés sur la plateforme."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={chargerVehicules}
            disabled={loading}
            className="bg-[#D4AF37] text-black font-bold rounded-lg px-5 py-3 hover:bg-yellow-500 disabled:opacity-50"
          >
            Actualiser
          </button>

          {peutModifier && (
            <button
              onClick={() => navigate("/admin/add-vehicle")}
              className="bg-green-600 text-white font-bold rounded-lg px-5 py-3 hover:bg-green-500"
            >
              Ajouter un véhicule
            </button>
          )}
        </div>
      </div>

      {/* Total */}
      <div className="bg-[#171717] border border-gray-800 rounded-xl p-5 mb-6">
        <p className="text-gray-400">Total des véhicules</p>

        <p className="text-3xl font-black text-[#D4AF37] mt-2">
          {vehicles.length}
        </p>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 mb-5">
          {error}
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <p className="text-gray-400">
          Chargement des véhicules...
        </p>
      ) : vehicles.length === 0 ? (
        <div className="bg-[#171717] border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-300">
            Aucun véhicule enregistré.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-[#171717] border border-gray-800 rounded-xl">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-[#222] text-gray-400 text-sm">
              <tr>
                <th className="p-4">Véhicule</th>
                <th className="p-4">Année</th>
                <th className="p-4">Prix</th>
                <th className="p-4">Kilométrage</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {vehicles.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  className="border-t border-gray-800 text-gray-300"
                >
                  {/* Véhicule et photo */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {vehicle.image_url ? (
                        <img
                          src={obtenirImage(vehicle.image_url)}
                          alt={`${vehicle.marque} ${vehicle.modele}`}
                          className="w-20 h-14 object-cover rounded-lg border border-gray-700"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      ) : (
                        <div className="w-20 h-14 rounded-lg bg-[#252525] flex items-center justify-center text-xs text-gray-500">
                          Sans photo
                        </div>
                      )}

                      <span className="font-semibold text-white">
                        {vehicle.marque} {vehicle.modele}
                      </span>
                    </div>
                  </td>

                  {/* Année */}
                  <td className="p-4">
                    {vehicle.annee}
                  </td>

                  {/* Prix */}
                  <td className="p-4 text-[#D4AF37] font-semibold">
                    {formaterPrix(vehicle.prix)}
                  </td>

                  {/* Kilométrage */}
                  <td className="p-4">
                    {Number(vehicle.kilometrage).toLocaleString("fr-FR")} km
                  </td>

                  {/* Statut */}
                  <td className="p-4">
                    {peutModifier ? (
                      <select
                        value={vehicle.statut}
                        disabled={statutEnCours === vehicle.id}
                        onChange={(e) =>
                          changerStatut(vehicle, e.target.value)
                        }
                        className={`rounded-lg border px-3 py-2 font-semibold cursor-pointer outline-none disabled:opacity-50 ${
                          vehicle.statut === "DISPONIBLE"
                            ? "bg-green-500/10 text-green-400 border-green-500/30"
                            : vehicle.statut === "VENDU"
                              ? "bg-red-500/10 text-red-400 border-red-500/30"
                              : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                        }`}
                      >
                        <option value="DISPONIBLE" className="bg-[#222] text-white">
                          Disponible
                        </option>

                        <option value="RESERVE" className="bg-[#222] text-white">
                          Réservé
                        </option>

                        <option value="VENDU" className="bg-[#222] text-white">
                          Vendu
                        </option>
                      </select>
                    ) : (
                      <span className="font-semibold">
                        {vehicle.statut === "DISPONIBLE"
                          ? "Disponible"
                          : vehicle.statut === "RESERVE"
                            ? "Réservé"
                            : "Vendu"}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() =>
                          navigate(`/admin/vehicle-details/${vehicle.id}`)
                        }
                        className="text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        Voir
                      </button>

                      {peutModifier && (
                        <>
                          <button
                            onClick={() =>
                              navigate(`/admin/edit-vehicle/${vehicle.id}`)
                            }
                            className="text-[#D4AF37] hover:text-yellow-300 font-semibold"
                          >
                            Modifier
                          </button>

                          <button
                            onClick={() => supprimerVehicule(vehicle.id)}
                            className="text-red-400 hover:text-red-300 font-semibold"
                          >
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default Vehicles
