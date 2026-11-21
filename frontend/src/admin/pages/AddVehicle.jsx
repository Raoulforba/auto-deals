
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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

export default function AddVehicle() {
  const navigate = useNavigate()

  const [form, setForm] = useState(INITIAL_FORM)
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [verificationRole, setVerificationRole] = useState(true)
  const [autorise, setAutorise] = useState(false)

  // Vérification du rôle de l'utilisateur
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

  // Libération de l'aperçu de la photo
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

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
    setPreview(URL.createObjectURL(file))
  }

  function removePhoto() {
    setPhoto(null)
    setPreview("")
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")

    // Protection des utilisateurs non autorisés
    if (!autorise) {
      setError("Vous n'avez pas l'autorisation d'ajouter un véhicule.")
      return
    }

    const prix = Number(form.prix)
    const kilometrage = Number(form.kilometrage)
    const annee = Number(form.annee)

    // Vérification des champs obligatoires
    if (!form.marque.trim() || !form.modele.trim()) {
      setError("La marque et le modèle sont obligatoires.")
      return
    }

    if (
      !form.annee.trim() ||
      !form.prix.trim() ||
      !form.kilometrage.trim() ||
      !Number.isInteger(annee) ||
      !Number.isFinite(prix) ||
      !Number.isInteger(kilometrage) ||
      annee <= 0 ||
      prix <= 0 ||
      kilometrage < 0
    ) {
      setError("Vérifie l'année, le prix et le kilométrage.")
      return
    }

    setLoading(true)

    try {
      let imageUrl = ""

      // Importation de la photo vers FastAPI
      if (photo) {
        const token = sessionStorage.getItem("auto_deals_token")

        if (!token) {
          throw new Error("Session expirée. Reconnecte-toi.")
        }

        const formData = new FormData()
        formData.append("fichier", photo)

        const uploadResponse = await fetch(
          `${API_URL}/uploads/vehicule`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        )

        const uploadData = await uploadResponse.json().catch(() => ({}))

        if (!uploadResponse.ok) {
          throw new Error(
            uploadData.detail || "Échec de l'importation de la photo."
          )
        }

        imageUrl = uploadData.image_url
      }

      // Enregistrement du véhicule dans la base de données
      const vehicleData = {
        marque: form.marque.trim(),
        modele: form.modele.trim(),
        annee,
        prix,
        kilometrage,
        carburant: form.carburant,
        transmission: form.transmission,
        description: form.description.trim(),
        image_url: imageUrl,
        statut: form.statut,
      }

      await apiRequest("/vehicules/", {
        method: "POST",
        body: JSON.stringify(vehicleData),
      })

      navigate("/admin/vehicles")
    } catch (err) {
      setError(
        typeof err.message === "string"
          ? err.message
          : "Une erreur est survenue pendant l'enregistrement."
      )
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    "w-full bg-[#242424] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-yellow-500"

  // Affichage pendant la vérification
  if (verificationRole) {
    return (
      <div className="p-6 text-gray-400">
        Vérification des autorisations...
      </div>
    )
  }

  // Ne pas afficher le formulaire si l'utilisateur n'est pas autorisé
  if (!autorise) {
    return null
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-2">
        Ajouter un véhicule
      </h1>

      <p className="text-gray-400 mb-6">
        Enregistrer un nouveau véhicule dans le catalogue AUTO DEALS.
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
            ["marque", "Marque", "Toyota"],
            ["modele", "Modèle", "Avensis"],
            ["annee", "Année", "2020"],
            ["prix", "Prix (FCFA)", "8500000"],
            ["kilometrage", "Kilométrage (km)", "85000"],
          ].map(([name, label, placeholder]) => (
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
                  ["annee", "prix", "kilometrage"].includes(name)
                    ? 0
                    : undefined
                }
                step={name === "prix" ? "any" : "1"}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
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

        {/* Importation de la photo */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Photo principale du véhicule
          </label>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-xl p-6 cursor-pointer hover:border-yellow-500 transition">
            <span className="text-yellow-500 text-3xl mb-2">
              ＋
            </span>

            <span className="font-medium">
              Choisir une photo depuis l'ordinateur
            </span>

            <span className="text-gray-400 text-sm mt-1">
              JPG, PNG ou WEBP — 5 Mo maximum
            </span>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </label>

          {preview && (
            <div className="mt-4 w-full max-w-sm">
              <img
                src={preview}
                alt="Aperçu du véhicule"
                className="w-full h-52 object-cover rounded-xl border border-gray-700"
              />

              <button
                type="button"
                onClick={removePhoto}
                className="mt-2 text-sm text-red-400 hover:text-red-300"
              >
                Supprimer cette photo
              </button>
            </div>
          )}
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
            placeholder="Décris les caractéristiques du véhicule..."
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg hover:bg-yellow-400 disabled:opacity-50"
          >
            {loading ? "Enregistrement..." : "Enregistrer le véhicule"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/vehicles")}
            disabled={loading}
            className="border border-gray-600 px-6 py-3 rounded-lg"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
