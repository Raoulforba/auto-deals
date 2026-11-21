
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { apiRequest } from "../../services/api"

const API_URL = "http://127.0.0.1:8000"

const INITIAL_FORM = {
  marque: "",
  modele: "",
  annee: "",
  prix: "",
  kilometrage: "",
  carburant: "Essence",
  transmission: "Automatique",
  description: "",
  statut: "DISPONIBLE",
}

export default function EditVehicle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState(INITIAL_FORM)
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState("")
  const [ancienneImage, setAncienneImage] = useState("")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [verificationRole, setVerificationRole] = useState(true)
  const [autorise, setAutorise] = useState(false)

  // Vérification des permissions
  useEffect(() => {
    let actif = true

    async function verifierAcces() {
      try {
        const admin = await apiRequest("/auth/me")

        const autorisation =
          admin.role === "SUPER_ADMIN" ||
          admin.role === "ADMINISTRATEUR"

        if (!actif) return

        setAutorise(autorisation)

        if (!autorisation) {
          navigate("/admin/vehicles", { replace: true })
        }
      } catch {
        if (actif) {
          navigate("/admin/login", { replace: true })
        }
      } finally {
        if (actif) {
          setVerificationRole(false)
        }
      }
    }

    verifierAcces()

    return () => {
      actif = false
    }
  }, [navigate])

  // Chargement du véhicule
  useEffect(() => {
    if (verificationRole || !autorise) return

    let actif = true

    async function chargerVehicule() {
      try {
        const data = await apiRequest(`/vehicules/${id}`)

        if (!actif) return

        setForm({
          marque: data.marque ?? "",
          modele: data.modele ?? "",
          annee: String(data.annee ?? ""),
          prix: String(data.prix ?? ""),
          kilometrage: String(data.kilometrage ?? ""),
          carburant: data.carburant ?? "Essence",
          transmission: data.transmission ?? "Automatique",
          description: data.description ?? "",
          statut: data.statut ?? "DISPONIBLE",
        })

        setAncienneImage(data.image_url ?? "")
      } catch (err) {
        if (actif) setError(err.message)
      } finally {
        if (actif) setLoading(false)
      }
    }

    chargerVehicule()

    return () => {
      actif = false
    }
  }, [id, verificationRole, autorise])

  // Aperçu de la nouvelle photo
  useEffect(() => {
    if (!photo) {
      setPreview("")
      return
    }

    const url = URL.createObjectURL(photo)
    setPreview(url)

    return () => URL.revokeObjectURL(url)
  }, [photo])

  function handleChange(e) {
    const { name, value } = e.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]

    if (!file) return

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Format non autorisé. Choisis JPG, PNG ou WEBP.")
      e.target.value = ""
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("La photo ne doit pas dépasser 5 Mo.")
      e.target.value = ""
      return
    }

    setError("")
    setPhoto(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")

    // Protection contre les modifications non autorisées
    if (!autorise) {
      setError("Vous n'avez pas l'autorisation de modifier ce véhicule.")
      return
    }

    const annee = Number(form.annee)
    const prix = Number(form.prix)
    const kilometrage = Number(form.kilometrage)

    if (
      !form.marque.trim() ||
      !form.modele.trim() ||
      !Number.isInteger(annee) ||
      annee < 1900 ||
      annee > 2100 ||
      !Number.isFinite(prix) ||
      prix <= 0 ||
      !Number.isInteger(kilometrage) ||
      kilometrage < 0
    ) {
      setError(
        "Vérifie la marque, le modèle, l'année, le prix et le kilométrage."
      )
      return
    }

    setSaving(true)

    try {
      let imageUrl = ancienneImage

      // Importation d'une nouvelle photo
      if (photo) {
        const token = sessionStorage.getItem("auto_deals_token")

        if (!token) {
          throw new Error("Session expirée. Reconnecte-toi.")
        }

        const formData = new FormData()
        formData.append("fichier", photo)

        const response = await fetch(`${API_URL}/uploads/vehicule`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })

        const uploadData = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(
            uploadData.detail || "Impossible d'importer la nouvelle photo."
          )
        }

        imageUrl = uploadData.image_url
      }

      // Données du véhicule
      const donnees = {
        marque: form.marque.trim(),
        modele: form.modele.trim(),
        annee,
        prix,
        kilometrage,
        carburant: form.carburant,
        transmission: form.transmission,
        description: form.description.trim(),
        image_url: imageUrl || null,
        statut: form.statut,
      }

      // Mise à jour du véhicule
      await apiRequest(`/vehicules/${id}`, {
        method: "PUT",
        body: JSON.stringify(donnees),
      })

      navigate("/admin/vehicles")
    } catch (err) {
      setError(err.message || "Une erreur est survenue.")
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    "w-full bg-[#242424] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-yellow-500"

  // Vérification en cours
  if (verificationRole) {
    return (
      <p className="p-6 text-gray-400">
        Vérification des autorisations...
      </p>
    )
  }

  // Accès refusé
  if (!autorise) {
    return null
  }

  if (loading) {
    return (
      <p className="p-6 text-gray-400">
        Chargement du véhicule...
      </p>
    )
  }

  return (
    <section className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-2">
        Modifier le véhicule
      </h1>

      <p className="text-gray-400 mb-6">
        Modifie les informations de ton véhicule AUTO DEALS.
      </p>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl bg-[#171717] border border-gray-800 rounded-xl p-6 space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            ["marque", "Marque"],
            ["modele", "Modèle"],
            ["annee", "Année"],
            ["prix", "Prix (FCFA)"],
            ["kilometrage", "Kilométrage (km)"],
          ].map(([name, label]) => (
            <div key={name}>
              <label className="block text-sm text-gray-300 mb-2">
                {label}
              </label>

              <input
                name={name}
                type={
                  ["annee", "prix", "kilometrage"].includes(name)
                    ? "number"
                    : "text"
                }
                min={
                  name === "annee"
                    ? 1900
                    : ["prix", "kilometrage"].includes(name)
                      ? 0
                      : undefined
                }
                max={name === "annee" ? 2100 : undefined}
                step={name === "prix" ? "any" : "1"}
                value={form[name]}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
          ))}

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Carburant
            </label>

            <select
              name="carburant"
              value={form.carburant}
              onChange={handleChange}
              className={inputClass}
            >
              {["Essence", "Diesel", "Hybride", "Électrique"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Transmission
            </label>

            <select
              name="transmission"
              value={form.transmission}
              onChange={handleChange}
              className={inputClass}
            >
              {["Automatique", "Manuelle"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Statut
            </label>

            <select
              name="statut"
              value={form.statut}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="DISPONIBLE">Disponible</option>
              <option value="VENDU">Vendu</option>
              <option value="RESERVE">Réservé</option>
            </select>
          </div>
        </div>

        {/* Photo du véhicule */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Photo du véhicule
          </label>

          {(preview || ancienneImage) && (
            <img
              src={
                preview ||
                (ancienneImage.startsWith("http")
                  ? ancienneImage
                  : `${API_URL}${ancienneImage}`)
              }
              alt="Photo du véhicule"
              className="w-full max-w-sm h-52 object-cover rounded-xl border border-gray-700 mb-3"
            />
          )}

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            className="block w-full text-sm text-gray-300"
          />

          <p className="text-gray-500 text-xs mt-2">
            JPG, PNG ou WEBP — 5 Mo maximum. Sans nouvelle photo, l'ancienne est conservée.
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Description
          </label>

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="4"
            className={inputClass}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg hover:bg-yellow-400 disabled:opacity-50"
          >
            {saving
              ? "Enregistrement..."
              : "Enregistrer les modifications"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/vehicles")}
            disabled={saving}
            className="border border-gray-600 px-6 py-3 rounded-lg"
          >
            Annuler
          </button>
        </div>
      </form>
    </section>
  )
}
