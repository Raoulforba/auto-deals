
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { apiRequest } from "../services/api"

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
const WHATSAPP_NUMBER = "237657902986"

export default function PublicVehicleDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [photoActive, setPhotoActive] = useState(0)

  useEffect(() => {
    let actif = true

    async function chargerVehicule() {
      try {
        const data = await apiRequest(`/vehicules/public/${id}`)

        if (actif) {
          setVehicle(data)
          setPhotoActive(0)
        }
      } catch (err) {
        if (actif) {
          setError(err.message || "Véhicule introuvable.")
        }
      } finally {
        if (actif) setLoading(false)
      }
    }

    chargerVehicule()

    return () => {
      actif = false
    }
  }, [id])

  // Construire la galerie avec la photo principale et les photos supplémentaires
  const photos = vehicle
    ? [
        ...(vehicle.image_url ? [vehicle.image_url] : []),
        ...(vehicle.photos || []).map(photo => photo.image_url),
      ].filter((url, index, tableau) => tableau.indexOf(url) === index)
    : []

  const photoUrl = (url) =>
    url?.startsWith("http") ? url : `${API_URL}${url}`

  const whatsappMessage = encodeURIComponent(
    `Bonjour AUTO DEALS, je suis intéressé par le véhicule ${vehicle?.marque ?? ""} ${vehicle?.modele ?? ""}. Pouvez-vous me donner plus d'informations ?`
  )

  const photoPrecedente = () => {
    setPhotoActive(index =>
      index === 0 ? photos.length - 1 : index - 1
    )
  }

  const photoSuivante = () => {
    setPhotoActive(index =>
      index === photos.length - 1 ? 0 : index + 1
    )
  }

  return (
    <>
      <Navbar />

      <main className="bg-gray-100 min-h-screen py-12 px-6">
        <div className="max-w-6xl mx-auto">

          <button
            onClick={() => navigate("/")}
            className="mb-8 text-[#A17C19] font-bold hover:underline"
          >
            ← Retour au catalogue
          </button>

          {loading ? (
            <div className="bg-white rounded-2xl p-10 text-center">
              Chargement du véhicule...
            </div>
          ) : error || !vehicle ? (
            <div className="bg-white rounded-2xl p-10 text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Véhicule indisponible
              </h2>
              <p className="text-gray-500 mt-3">
                {error || "Ce véhicule n'est plus disponible."}
              </p>
              <button
                onClick={() => navigate("/")}
                className="mt-6 bg-[#D4AF37] px-6 py-3 rounded-lg font-bold"
              >
                Retour à l'accueil
              </button>
            </div>
          ) : (
            <article className="bg-white rounded-2xl overflow-hidden shadow-xl">

              {/* Galerie photos */}
              <section className="bg-gray-950 p-3 md:p-5">
                <div className="relative h-72 md:h-[520px] bg-gray-900 rounded-xl overflow-hidden">

                  {photos.length > 0 ? (
                    <>
                      <img
                        src={photoUrl(photos[photoActive])}
                        alt={`${vehicle.marque} ${vehicle.modele} - photo ${photoActive + 1}`}
                        className="w-full h-full object-contain"
                      />

                      {photos.length > 1 && (
                        <>
                          <button
                            onClick={photoPrecedente}
                            aria-label="Photo précédente"
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 text-white w-11 h-11 rounded-full text-2xl hover:bg-[#D4AF37] hover:text-black transition"
                          >
                            ‹
                          </button>

                          <button
                            onClick={photoSuivante}
                            aria-label="Photo suivante"
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 text-white w-11 h-11 rounded-full text-2xl hover:bg-[#D4AF37] hover:text-black transition"
                          >
                            ›
                          </button>

                          <span className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                            {photoActive + 1} / {photos.length}
                          </span>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      Photo non disponible
                    </div>
                  )}
                </div>

                {/* Miniatures */}
                {photos.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto mt-4 pb-2">
                    {photos.map((photo, index) => (
                      <button
                        key={`${photo}-${index}`}
                        onClick={() => setPhotoActive(index)}
                        className={`shrink-0 w-24 h-20 rounded-lg overflow-hidden border-2 transition ${
                          photoActive === index
                            ? "border-[#D4AF37]"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={photoUrl(photo)}
                          alt={`Miniature ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <div className="p-6 md:p-10">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <p className="text-[#A17C19] uppercase font-bold tracking-widest text-sm">
                      AUTO DEALS
                    </p>

                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-3">
                      {vehicle.marque} {vehicle.modele}
                    </h1>

                    <p className="text-gray-500 mt-2">
                      Année {vehicle.annee}
                    </p>
                  </div>

                  <span className="h-fit bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold">
                    Disponible
                  </span>
                </div>

                <div className="mt-8">
                  <p className="text-gray-500 text-sm font-semibold uppercase">
                    Prix de vente
                  </p>
                  <p className="text-3xl md:text-4xl font-black text-[#A17C19] mt-2">
                    {Number(vehicle.prix).toLocaleString("fr-FR")} FCFA
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-10">
                  {[
                    ["Année", vehicle.annee],
                    ["Kilométrage", `${Number(vehicle.kilometrage).toLocaleString("fr-FR")} km`],
                    ["Carburant", vehicle.carburant],
                    ["Transmission", vehicle.transmission],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-gray-50 p-5 rounded-xl">
                      <p className="text-gray-500 text-sm">{label}</p>
                      <p className="text-gray-900 font-bold text-lg mt-2">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-10">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Description du véhicule
                  </h2>

                  <p className="text-gray-600 leading-8 mt-4 whitespace-pre-line">
                    {vehicle.description || "Aucune description disponible."}
                  </p>
                </div>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-center bg-[#111111] text-white py-4 rounded-xl mt-10 font-bold hover:bg-[#D4AF37] hover:text-black transition"
                >
                  Contacter AUTO DEALS sur WhatsApp
                </a>
              </div>
            </article>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
