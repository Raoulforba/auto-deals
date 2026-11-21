
import { useState } from "react"

function SearchBar({ onSearch, onReset, brands = [] }) {
  const [filters, setFilters] = useState({
    brand: "",
    maxPrice: "",
    year: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(filters)
  }

  const handleReset = () => {
    setFilters({
      brand: "",
      maxPrice: "",
      year: "",
    })

    onReset()
  }

  return (
    <section className="relative z-10 bg-gray-100 px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl p-6 md:p-8">

          <h2 className="text-2xl font-black text-gray-900 mb-6">
            Trouvez votre véhicule
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              <div>
                <label className="block mb-2 font-semibold">
                  Marque
                </label>

                <select
                  name="brand"
                  value={filters.brand}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-4"
                >
                  <option value="">Toutes les marques</option>

                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-semibold">
                  Prix maximum
                </label>

                <select
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-4"
                >
                  <option value="">Tous les prix</option>
                  <option value="5000000">5 000 000 FCFA</option>
                  <option value="10000000">10 000 000 FCFA</option>
                  <option value="15000000">15 000 000 FCFA</option>
                  <option value="20000000">20 000 000 FCFA</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-semibold">
                  Année
                </label>

                <select
                  name="year"
                  value={filters.year}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-4"
                >
                  <option value="">Toutes les années</option>
                  <option value="2020">2020 et plus</option>
                  <option value="2015">2015 - 2019</option>
                  <option value="2010">2010 - 2014</option>
                  <option value="2009">Avant 2010</option>
                </select>
              </div>

            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="submit"
                className="flex-1 bg-[#D4AF37] text-black font-bold rounded-lg p-4 hover:bg-yellow-500"
              >
                Rechercher
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="border rounded-lg px-6 py-4 font-semibold"
              >
                Réinitialiser
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default SearchBar
