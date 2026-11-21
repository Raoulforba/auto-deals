
import { useEffect, useState } from "react"
import { apiRequest } from "../../services/api"

const PAR_PAGE = 10

const ACTIONS = [
  "AJOUT",
  "MODIFICATION",
  "CHANGEMENT_STATUT",
  "SUPPRESSION",
  "AJOUT_PHOTOS",
  "SUPPRESSION_PHOTO",
]

function Activities() {
  const [activites, setActivites] = useState([])

  const [statistiques, setStatistiques] = useState({
    total: 0,
    ajouts: 0,
    modifications: 0,
    suppressions: 0,
  })

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)

  const [recherche, setRecherche] = useState("")
  const [filtreAction, setFiltreAction] = useState("")
  const [dateDebut, setDateDebut] = useState("")
  const [dateFin, setDateFin] = useState("")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const chargerActivites = async () => {
    setLoading(true)
    setError("")

    try {
      const params = new URLSearchParams({
        page: String(page),
        par_page: String(PAR_PAGE),
      })

      if (recherche.trim()) {
        params.set("recherche", recherche.trim())
      }

      if (filtreAction) {
        params.set("action", filtreAction)
      }

      if (dateDebut) {
        params.set("date_debut", dateDebut)
      }

      if (dateFin) {
        params.set("date_fin", dateFin)
      }

      const [resultat, stats] = await Promise.all([
        apiRequest(`/activites/?${params.toString()}`),
        apiRequest("/activites/statistiques"),
      ])

      setActivites(resultat.items)
      setTotal(resultat.total)
      setTotalPages(resultat.total_pages)
      setStatistiques(stats)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    chargerActivites()
  }, [page, recherche, filtreAction, dateDebut, dateFin])

  const formaterDate = (date) =>
    new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  const obtenirCouleur = (action) => {
    if (action.includes("AJOUT")) return "text-green-400"
    if (action.includes("SUPPRESSION")) return "text-red-400"
    if (action.includes("MODIFICATION")) return "text-yellow-400"
    if (action.includes("CHANGEMENT")) return "text-blue-400"

    return "text-gray-300"
  }

  const cartes = [
    {
      titre: "Total des activités",
      valeur: statistiques.total,
      couleur: "text-[#D4AF37]",
    },
    {
      titre: "Ajouts",
      valeur: statistiques.ajouts,
      couleur: "text-green-400",
    },
    {
      titre: "Modifications",
      valeur: statistiques.modifications,
      couleur: "text-yellow-400",
    },
    {
      titre: "Suppressions",
      valeur: statistiques.suppressions,
      couleur: "text-red-400",
    },
  ]

  const reinitialiserFiltres = () => {
    setRecherche("")
    setFiltreAction("")
    setDateDebut("")
    setDateFin("")
    setPage(1)
  }

  return (
    <section>
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <p className="text-[#D4AF37] text-sm font-semibold">
            SUIVI ET CONTRÔLE
          </p>

          <h1 className="text-3xl font-bold text-white mt-2">
            Historique des activités
          </h1>

          <p className="text-gray-400 mt-2">
            Suivez toutes les opérations effectuées sur AUTO DEALS.
          </p>
        </div>

        <button
          onClick={chargerActivites}
          disabled={loading}
          className="bg-[#D4AF37] text-black font-bold rounded-lg px-5 py-3 hover:bg-yellow-500 disabled:opacity-50"
        >
          {loading ? "Actualisation..." : "Actualiser"}
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 mb-5">
          {error}
        </div>
      )}

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {cartes.map((carte) => (
          <div
            key={carte.titre}
            className="bg-[#171717] border border-gray-800 rounded-xl p-5"
          >
            <p className="text-gray-400 text-sm">
              {carte.titre}
            </p>

            <p className={`text-3xl font-black mt-3 ${carte.couleur}`}>
              {carte.valeur}
            </p>
          </div>
        ))}
      </div>

      {/* Recherche et filtres */}
      <div className="bg-[#171717] border border-gray-800 rounded-xl p-5 mb-6">
        <h2 className="text-white font-bold mb-5">
          Recherche avancée
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Recherche
            </label>

            <input
              type="text"
              value={recherche}
              onChange={(e) => {
                setRecherche(e.target.value)
                setPage(1)
              }}
              placeholder="Véhicule, description, ID..."
              className="w-full bg-[#222] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Type d'action
            </label>

            <select
              value={filtreAction}
              onChange={(e) => {
                setFiltreAction(e.target.value)
                setPage(1)
              }}
              className="w-full bg-[#222] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
            >
              <option value="">Toutes les actions</option>

              {ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Date de début
            </label>

            <input
              type="date"
              value={dateDebut}
              max={dateFin || undefined}
              onChange={(e) => {
                setDateDebut(e.target.value)
                setPage(1)
              }}
              className="w-full bg-[#222] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Date de fin
            </label>

            <input
              type="date"
              value={dateFin}
              min={dateDebut || undefined}
              onChange={(e) => {
                setDateFin(e.target.value)
                setPage(1)
              }}
              className="w-full bg-[#222] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-5">
          <p className="text-gray-400 text-sm">
            {total} activité(s) correspondant aux critères
          </p>

          <button
            onClick={reinitialiserFiltres}
            className="text-[#D4AF37] hover:text-yellow-300 text-sm font-semibold text-left"
          >
            Réinitialiser les filtres
          </button>
        </div>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="bg-[#171717] border border-gray-800 rounded-xl p-8 text-center text-gray-400">
          Chargement des activités...
        </div>
      ) : activites.length === 0 ? (
        <div className="bg-[#171717] border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-300">
            Aucune activité correspondant à ces critères.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-[#171717] border border-gray-800 rounded-xl">
          <table className="w-full text-left min-w-[850px]">
            <thead className="bg-[#222] text-gray-400 text-sm">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Action</th>
                <th className="p-4">Description</th>
                <th className="p-4">Administrateur</th>
                <th className="p-4">Véhicule</th>
              </tr>
            </thead>

            <tbody>
              {activites.map((activite) => (
                <tr
                  key={activite.id}
                  className="border-t border-gray-800 text-gray-300 hover:bg-[#202020]"
                >
                  <td className="p-4 whitespace-nowrap">
                    {formaterDate(activite.date_creation)}
                  </td>

                  <td className={`p-4 font-bold ${obtenirCouleur(activite.action)}`}>
                    {activite.action}
                  </td>

                  <td className="p-4">
                    {activite.description}
                  </td>

                  <td className="p-4">
                    {activite.administrateur_id
                      ? `Administrateur #${activite.administrateur_id}`
                      : "Administrateur supprimé"}
                  </td>

                  <td className="p-4">
                    {activite.vehicule_id
                      ? `Véhicule #${activite.vehicule_id}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <p className="text-gray-400 text-sm">
            Page {page} sur {totalPages}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-5 py-2 rounded-lg border border-gray-700 text-white hover:bg-[#222] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Précédent
            </button>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-5 py-2 rounded-lg bg-[#D4AF37] text-black font-bold hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default Activities
