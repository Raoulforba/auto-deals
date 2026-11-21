
import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import Hero from "../components/Hero"
import SearchBar from "../components/SearchBar"
import VehicleCard from "../components/VehicleCard"
import Footer from "../components/Footer"
import { apiRequest } from "../services/api"

const API_URL = "http://127.0.0.1:8000"

function Home() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [filters, setFilters] = useState({
    brand: "",
    maxPrice: "",
    year: "",
  })

  useEffect(() => {
    let actif = true

    async function chargerVehicules() {
      try {
        const data = await apiRequest("/vehicules/public")

        if (!actif) return

        const formattedVehicles = data.map((vehicle) => ({
          id: vehicle.id,
          brand: vehicle.marque,
          name: `${vehicle.marque} ${vehicle.modele}`,
          year: vehicle.annee,
          fuel: vehicle.carburant,
          transmission: vehicle.transmission,
          mileage: vehicle.kilometrage,
          price: Number(vehicle.prix),
          status: vehicle.statut,
          description: vehicle.description,
          image: vehicle.image_url
            ? vehicle.image_url.startsWith("http")
              ? vehicle.image_url
              : `${API_URL}${vehicle.image_url}`
            : null,
        }))

        setVehicles(formattedVehicles)
      } catch (err) {
        if (actif) {
          setError(err.message || "Impossible de charger les véhicules.")
        }
      } finally {
        if (actif) setLoading(false)
      }
    }

    chargerVehicules()

    return () => {
      actif = false
    }
  }, [])

  const brands = [...new Set(vehicles.map((v) => v.brand))].sort()

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesBrand =
      !filters.brand || vehicle.brand === filters.brand

    const matchesPrice =
      !filters.maxPrice ||
      vehicle.price <= Number(filters.maxPrice)

    let matchesYear = true

    if (filters.year === "2020") {
      matchesYear = vehicle.year >= 2020
    } else if (filters.year === "2015") {
      matchesYear = vehicle.year >= 2015 && vehicle.year <= 2019
    } else if (filters.year === "2010") {
      matchesYear = vehicle.year >= 2010 && vehicle.year <= 2014
    } else if (filters.year === "2009") {
      matchesYear = vehicle.year < 2010
    }

    return matchesBrand && matchesPrice && matchesYear
  })

  const resetFilters = () => {
    setFilters({
      brand: "",
      maxPrice: "",
      year: "",
    })
  }

  return (
    <>
      <Navbar />

      <Hero />

      <SearchBar
        onSearch={setFilters}
        onReset={resetFilters}
        brands={brands}
      />

      <section id="vehicules" className="bg-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-12">
            <p className="text-[#A17C19] font-bold tracking-widest uppercase">
              Notre catalogue
            </p>

            <h2 className="text-4xl font-black mt-3 text-gray-900">
              Nos véhicules disponibles
            </h2>

            <p className="text-gray-500 mt-4">
              Découvrez nos véhicules et trouvez celui qui vous correspond.
            </p>

            {!loading && !error && (
              <p className="mt-5 font-semibold text-gray-700">
                {filteredVehicles.length} véhicule(s) trouvé(s)
              </p>
            )}
          </div>

          {loading ? (
            <div className="text-center py-16">
              <p className="text-gray-600 font-semibold">
                Chargement des véhicules...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-white rounded-2xl">
              <h3 className="text-xl font-bold text-red-600">
                Impossible de charger le catalogue
              </h3>

              <p className="text-gray-500 mt-3">
                {error}
              </p>
            </div>
          ) : filteredVehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl">
              <h3 className="text-2xl font-bold text-gray-800">
                Aucun véhicule trouvé
              </h3>

              <p className="text-gray-500 mt-3">
                Essayez de modifier vos critères de recherche.
              </p>

              <button
                onClick={resetFilters}
                className="mt-6 bg-[#D4AF37] text-black px-6 py-3 rounded-lg font-bold"
              >
                Voir tous les véhicules
              </button>
            </div>
          )}

        </div>
      </section>

      <Footer />
    </>
  )
}

export default Home
