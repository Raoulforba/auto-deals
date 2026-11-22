
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { apiRequest } from "../../services/api"

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export default function VehicleDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [peutModifier, setPeutModifier] = useState(false)
  const [fichiers, setFichiers] = useState([])
  const [envoi, setEnvoi] = useState(false)
  const [message, setMessage] = useState("")
  const [erreurEnvoi, setErreurEnvoi] = useState("")

  // Chargement des informations et vérification du rôle
  useEffect(() => {
    let actif = true

    async function charger() {
      try {
        const admin = await apiRequest("/auth/me")

        if (!actif) return

        const autorisation =
          admin.role === "SUPER_ADMIN" ||
          admin.role === "ADMINISTRATEUR"

        setPeutModifier(autorisation)

        const data = await apiRequest(`/vehicules/${id}`)

        if (actif) {
          setVehicle(data)
        }
      } catch (err) {
        if (actif) setError(err.message)
      } finally {
        if (actif) setLoading(false)
      }
    }

    charger()

    return () => {
      actif = false
    }
  }, [id])

  async function chargerDetails() {
    const data = await apiRequest(`/vehicules/${id}`)
    setVehicle(data)
  }

  const formaterPrix = (prix) =>
    Number(prix).toLocaleString("fr-FR") + " FCFA"

  const obtenirImage = (imageUrl) => {
    if (!imageUrl) return null

    return imageUrl.startsWith("http")
      ? imageUrl
      : `${API_URL}${imageUrl}`
  }

  // Importation des photos supplémentaires
  async function importerPhotos(e) {
    e.preventDefault()

    setMessage("")
    setErreurEnvoi("")

    if (!peutModifier) {
      setErreurEnvoi("Vous n'avez pas l'autorisation d'ajouter des photos.")
      return
    }

    if (fichiers.length === 0) {
      setErreurEnvoi("Sélectionne au moins une photo.")
      return
    }

    if (fichiers.length > 10) {
      setErreurEnvoi("Tu peux sélectionner 10 photos maximum par envoi.")
      return
    }

    const formatsAutorises = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ]

    for (const fichier of fichiers) {
      if (!formatsAutorises.includes(fichier.type)) {
        setErreurEnvoi("Format non autorisé. Choisis JPG, PNG ou WEBP.")
        return
      }

      if (fichier.size > 5 * 1024 * 1024) {
        setErreurEnvoi("Chaque photo ne doit pas dépasser 5 Mo.")
        return
      }
    }

    const formulaire = new FormData()

    fichiers.forEach((fichier) => {
      formulaire.append("fichiers", fichier)
    })

    try {
      setEnvoi(true)

      const token = sessionStorage.getItem("auto_deals_token")

      if (!token) {
        throw new Error("Session expirée. Reconnecte-toi.")
      }

      const response = await fetch(
        `${API_URL}/uploads/vehicule/${id}/photos`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formulaire,
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.detail || "Échec de l'importation.")
      }

      await chargerDetails()

      setFichiers([])
      e.target.reset()

      setMessage(
        `${data.nombre_photos} photo(s) ajoutée(s) avec succès.`
      )
    } catch (err) {
      setErreurEnvoi(err.message)
    } finally {
      setEnvoi(false)
    }
  }

  // Suppression d'une photo supplémentaire
  async function supprimerPhoto(photoId) {
    if (!peutModifier) return

    const confirmation = window.confirm(
      "Veux-tu vraiment supprimer cette photo ?"
    )

    if (!confirmation) return

    try {
      await apiRequest(
        `/uploads/vehicule/${vehicle.id}/photos/${photoId}`,
        { method: "DELETE" }
      )

      await chargerDetails()

      setMessage("Photo supprimée avec succès.")
      setErreurEnvoi("")
    } catch (err) {
      setErreurEnvoi(err.message)
    }
  }

  const statutStyle = {
    DISPONIBLE: "bg-green-500/10 text-green-400 border-green-500/30",
    VENDU: "bg-red-500/10 text-red-400 border-red-500/30",
    RESERVE: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  }

  if (loading) {
    return (
      <div className="p-6 text-gray-400">
        Chargement des informations du véhicule...
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className="p-6">
        <p className="text-red-400 mb-4">
          {error || "Véhicule introuvable."}
        </p>

        <button
          onClick={() => navigate("/admin/vehicles")}
          className="text-[#D4AF37] font-semibold"
        >
          Retour aux véhicules
        </button>
      </div>
    )
  }

  const galerie = [
    ...(vehicle.image_url ? [vehicle.image_url] : []),
    ...(vehicle.photos || []).map((photo) => photo.image_url),
  ]

  return (
    <section className="p-6 text-white">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-[#D4AF37] text-sm font-semibold">
            GESTION DU STOCK
          </p>

          <h1 className="text-3xl font-bold mt-2">
            Détails du véhicule
          </h1>

          <p className="text-gray-400 mt-2">
            Consulte les caractéristiques et les photos du véhicule.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/admin/vehicles")}
            className="border border-gray-700 px-5 py-3 rounded-lg hover:bg-[#252525]"
          >
            Retour
          </button>

          {peutModifier && (
            <button
              onClick={() => navigate(`/admin/edit-vehicle/${vehicle.id}`)}
              className="bg-[#D4AF37] text-black font-bold px-5 py-3 rounded-lg hover:bg-yellow-500"
            >
              Modifier
            </button>
          )}
        </div>
      </div>

      {/* Informations principales */}
      <div className="max-w-5xl bg-[#171717] border border-gray-800 rounded-xl overflow-hidden">
        <div className="w-full h-72 md:h-[420px] bg-[#222]">
          {vehicle.image_url ? (
            <img
              src={obtenirImage(vehicle.image_url)}
              alt={`${vehicle.marque} ${vehicle.modele}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              Aucune photo disponible
            </div>
          )}
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold">
                {vehicle.marque} {vehicle.modele}
              </h2>

              <p className="text-gray-400 mt-2">
                Année {vehicle.annee}
              </p>
            </div>

            <span
              className={`px-4 py-2 rounded-full border text-sm font-semibold ${
                statutStyle[vehicle.statut] ||
                "bg-gray-500/10 text-gray-400 border-gray-500/30"
              }`}
            >
              {vehicle.statut}
            </span>
          </div>

          {/* Prix */}
          <div className="mb-8">
            <p className="text-gray-400 text-sm mb-2">
              Prix de vente
            </p>

            <p className="text-3xl font-black text-[#D4AF37]">
              {formaterPrix(vehicle.prix)}
            </p>
          </div>

          {/* Caractéristiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#222] p-5 rounded-xl">
              <p className="text-gray-400 text-sm">Kilométrage</p>

              <p className="font-bold text-lg mt-2">
                {Number(vehicle.kilometrage).toLocaleString("fr-FR")} km
              </p>
            </div>

            <div className="bg-[#222] p-5 rounded-xl">
              <p className="text-gray-400 text-sm">Carburant</p>

              <p className="font-bold text-lg mt-2">
                {vehicle.carburant}
              </p>
            </div>

            <div className="bg-[#222] p-5 rounded-xl">
              <p className="text-gray-400 text-sm">Transmission</p>

              <p className="font-bold text-lg mt-2">
                {vehicle.transmission}
              </p>
            </div>
          </div>

          {/* Galerie photos */}
          <div className="mb-10">
            <h3 className="text-xl font-bold mb-4">
              Galerie photos ({galerie.length})
            </h3>

            {galerie.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {galerie.map((photo, index) => {
                  const photoSupplementaire =
                    index > 0 ? vehicle.photos?.[index - 1] : null

                  return (
                    <div
                      key={
                        index === 0
                          ? "principale"
                          : photoSupplementaire?.id
                      }
                      className="bg-[#222] rounded-lg overflow-hidden"
                    >
                      <img
                        src={obtenirImage(photo)}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-36 object-cover"
                      />

                      <div className="p-3">
                        <p className="text-xs text-gray-400 mb-3">
                          {index === 0
                            ? "Photo principale"
                            : `Photo ${index}`}
                        </p>

                        {peutModifier && index !== 0 && photoSupplementaire && (
                          <button
                            type="button"
                            onClick={() =>
                              supprimerPhoto(photoSupplementaire.id)
                            }
                            className="w-full bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg py-2 text-sm font-semibold hover:bg-red-600 hover:text-white transition"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-400">
                Aucune photo disponible.
              </p>
            )}
          </div>

          {/* Importation des photos : rôles autorisés uniquement */}
          {peutModifier && (
            <div className="border-t border-gray-800 pt-8 mb-8">
              <h3 className="text-xl font-bold mb-2">
                Ajouter des photos
              </h3>

              <p className="text-gray-400 text-sm mb-5">
                Sélectionne jusqu'à 10 images JPEG, PNG ou WEBP par envoi.
              </p>

              <form onSubmit={importerPhotos} className="space-y-4">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) =>
                    setFichiers(Array.from(e.target.files || []))
                  }
                  className="block w-full text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-[#D4AF37] file:px-4 file:py-3 file:font-bold file:text-black hover:file:bg-yellow-500"
                />

                {fichiers.length > 0 && (
                  <p className="text-gray-300 text-sm">
                    {fichiers.length} fichier(s) sélectionné(s)
                  </p>
                )}

                {message && (
                  <p className="text-green-400 text-sm">
                    {message}
                  </p>
                )}

                {erreurEnvoi && (
                  <p className="text-red-400 text-sm">
                    {erreurEnvoi}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={envoi || fichiers.length === 0}
                  className="bg-[#D4AF37] text-black font-bold px-6 py-3 rounded-lg hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {envoi
                    ? "Importation en cours..."
                    : "Ajouter les photos"}
                </button>
              </form>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-xl font-bold mb-3">
              Description
            </h3>

            <p className="text-gray-300 leading-7 whitespace-pre-line">
              {vehicle.description || "Aucune description renseignée."}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
