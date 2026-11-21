import { Link } from "react-router-dom"

function VehicleCard({ vehicle }) {
  if (!vehicle) return null

  const mileage = Number(vehicle.mileage ?? 0)
  const price = Number(vehicle.price ?? 0)

  const whatsappMessage = encodeURIComponent(
    `Bonjour AUTO DEALS, je suis intéressé par ${vehicle.name ?? "ce véhicule"}. Je souhaite avoir plus d'informations.`
  )

  return (
    <article className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 group hover:shadow-2xl transition duration-300">

      <div className="relative overflow-hidden">
        {vehicle.image ? (
          <img
            src={vehicle.image}
            alt={vehicle.name ?? "Véhicule"}
            className="w-full h-60 object-cover group-hover:scale-105 transition duration-500"
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
        ) : (
          <div className="w-full h-60 bg-gray-200 flex items-center justify-center text-gray-500">
            Photo non disponible
          </div>
        )}

        <span className="absolute top-4 left-4 bg-[#D4AF37] text-black px-4 py-2 rounded-full text-xs font-bold">
          Disponible
        </span>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900">
          {vehicle.name ?? "Véhicule sans nom"}
        </h3>

        <p className="text-gray-500 mt-2 text-sm">
          {vehicle.year} • {vehicle.fuel} • {vehicle.transmission}
        </p>

        <div className="grid grid-cols-2 gap-3 mt-5 text-sm text-gray-600">
          <div>
            <span className="font-semibold">Kilométrage</span>
            <p>{mileage.toLocaleString("fr-FR")} km</p>
          </div>

          <div>
            <span className="font-semibold">Carburant</span>
            <p>{vehicle.fuel}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-5 pt-5">
          <p className="text-xs text-gray-500 uppercase font-semibold">
            Prix de vente
          </p>

          <p className="text-2xl font-black text-[#A17C19] mt-1">
            {price.toLocaleString("fr-FR")} FCFA
          </p>
        <Link
      to={`/vehicule/${vehicle.id}`}
  className="block text-center border-2 border-[#D4AF37] text-[#A17C19] py-3 rounded-lg mt-5 font-bold hover:bg-[#D4AF37] hover:text-black transition"
>
  Voir les détails
</Link>
          <a
            href={`https://wa.me/237657902986?text=${whatsappMessage}`}
            target="_blank"
            rel="noreferrer"
            className="block text-center bg-[#111111] text-white py-3 rounded-lg mt-5 font-bold hover:bg-[#D4AF37] hover:text-black transition"
          >
            Contacter sur WhatsApp
          </a>
        </div>
      </div>
    </article>
  )
}

export default VehicleCard
