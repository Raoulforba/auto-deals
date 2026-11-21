import { useCallback, useEffect, useState } from "react"
import { apiRequest } from "../../services/api"

// --------------------------------------------------
// FONCTIONS UTILITAIRES
// --------------------------------------------------

function lireAdministrateur() {
  try {
    return JSON.parse(
      sessionStorage.getItem("auto_deals_admin") || "{}"
    )
  } catch {
    return {}
  }
}

function formaterMontant(montant) {
  return (
    new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(Number(montant) || 0) + " FCFA"
  )
}

function formaterDate(date) {
  if (!date) return "Date inconnue"

  const valeur = new Date(date)

  if (Number.isNaN(valeur.getTime())) {
    return "Date inconnue"
  }

  return valeur.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function couleurAction(action) {
  switch (action) {
    case "AJOUT":
      return "bg-green-500/10 text-green-400 border-green-500/20"

    case "MODIFICATION":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20"

    case "CHANGEMENT_STATUT":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"

    case "SUPPRESSION":
      return "bg-red-500/10 text-red-400 border-red-500/20"

    default:
      return "bg-gray-500/10 text-gray-400 border-gray-500/20"
  }
}


// --------------------------------------------------
// GRAPHIQUE CIRCULAIRE : RÉPARTITION DU STOCK
// --------------------------------------------------

function StockChart({ statistiques, loading }) {
  const donnees = [
    {
      nom: "Disponibles",
      valeur: statistiques?.disponibles ?? 0,
      couleur: "#D4AF37",
    },
    {
      nom: "Réservés",
      valeur: statistiques?.reserves ?? 0,
      couleur: "#EAB308",
    },
    {
      nom: "Vendus",
      valeur: statistiques?.vendus ?? 0,
      couleur: "#3B82F6",
    },
  ]

  const total = donnees.reduce(
    (somme, element) => somme + element.valeur,
    0
  )

  const rayon = 45
  const circonference = 2 * Math.PI * rayon

  let cumul = 0

  return (
    <div className="bg-[#171717] border border-gray-800 rounded-xl p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">
          Répartition du stock
        </h2>

        <p className="text-gray-500 text-sm mt-1">
          Distribution des véhicules par statut.
        </p>
      </div>

      {loading ? (
        <div className="h-56 flex items-center justify-center text-gray-400">
          Chargement du graphique...
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-around gap-8">

          {/* GRAPHIQUE CIRCULAIRE */}
          <div className="relative w-56 h-56 shrink-0">
            <svg
              viewBox="0 0 120 120"
              className="w-full h-full -rotate-90"
              role="img"
              aria-label={`Répartition de ${total} véhicules`}
            >
              <circle
                cx="60"
                cy="60"
                r={rayon}
                fill="none"
                stroke="#303030"
                strokeWidth="12"
              />

              {total > 0 &&
                donnees.map((element) => {
                  const longueur =
                    (element.valeur / total) * circonference

                  const decalage =
                    -(cumul / total) * circonference

                  cumul += element.valeur

                  return (
                    <circle
                      key={element.nom}
                      cx="60"
                      cy="60"
                      r={rayon}
                      fill="none"
                      stroke={element.couleur}
                      strokeWidth="12"
                      strokeDasharray={`${longueur} ${circonference}`}
                      strokeDashoffset={decalage}
                    />
                  )
                })}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white">
                {total}
              </span>

              <span className="text-gray-500 text-sm">
                Véhicules
              </span>
            </div>
          </div>

          {/* LÉGENDE */}
          <div className="w-full max-w-xs space-y-5">
            {donnees.map((element) => {
              const pourcentage =
                total > 0
                  ? Math.round((element.valeur / total) * 100)
                  : 0

              return (
                <div key={element.nom}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: element.couleur,
                        }}
                      />

                      <span className="text-gray-300 text-sm">
                        {element.nom}
                      </span>
                    </div>

                    <span className="text-white font-bold">
                      {element.valeur}
                    </span>
                  </div>

                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pourcentage}%`,
                        backgroundColor: element.couleur,
                      }}
                    />
                  </div>

                  <p className="text-gray-500 text-xs mt-1">
                    {pourcentage}% du parc
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}


// --------------------------------------------------
// GRAPHIQUE MENSUEL : ÉVOLUTION DES ACTIVITÉS
// --------------------------------------------------

function MonthlyActivityChart({ evolution, loading, annee }) {
  const series = [
    {
      key: "ajouts",
      nom: "Ajouts",
      couleur: "#D4AF37",
    },
    {
      key: "modifications",
      nom: "Modifications",
      couleur: "#3B82F6",
    },
    {
      key: "changements_statut",
      nom: "Changements de statut",
      couleur: "#EAB308",
    },
    {
      key: "suppressions",
      nom: "Suppressions",
      couleur: "#EF4444",
    },
  ]

  const mois = evolution || []

  // Abréviations explicites pour éviter la confusion entre juin et juillet.
  const libellesMois = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc",
  ]

  const maximum = Math.max(
    1,
    ...mois.map((element) =>
      series.reduce(
        (total, serie) =>
          total + (Number(element[serie.key]) || 0),
        0
      )
    )
  )

  const hauteur = 150
  const baseY = 190
  const largeurBarre = 28

  const aucuneActivite = mois.every((element) =>
    series.every(
      (serie) => Number(element[serie.key]) === 0
    )
  )

  return (
    <div className="bg-[#171717] border border-gray-800 rounded-xl p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">
          Évolution mensuelle des activités
        </h2>

        <p className="text-gray-500 text-sm mt-1">
          Suivi des opérations effectuées en {annee}.
        </p>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-400">
          Chargement du graphique...
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto">
            <svg
              viewBox="0 0 760 235"
              className="w-full min-w-[650px]"
              role="img"
              aria-label={`Évolution mensuelle des activités en ${annee}`}
            >
              {/* LIGNES DE REPÈRE */}
              {[0, 1, 2, 3].map((index) => {
                const y =
                  baseY - (index * hauteur) / 3

                return (
                  <g key={index}>
                    <line
                      x1="35"
                      y1={y}
                      x2="750"
                      y2={y}
                      stroke="#303030"
                      strokeDasharray="4 4"
                    />

                    <text
                      x="25"
                      y={y + 4}
                      fill="#888"
                      fontSize="10"
                      textAnchor="end"
                    >
                      {Math.round((maximum * index) / 3)}
                    </text>
                  </g>
                )
              })}

              {/* BARRES MENSUELLES */}
              {mois.map((element, index) => {
                const x = 48 + index * 58
                let cumul = 0

                return (
                  <g key={element.mois}>
                    {series.map((serie) => {
                      const valeur =
                        Number(element[serie.key]) || 0

                      const h =
                        (valeur / maximum) * hauteur

                      const y = baseY - cumul - h

                      cumul += h

                      return (
                        <rect
                          key={serie.key}
                          x={x}
                          y={y}
                          width={largeurBarre}
                          height={h}
                          rx="2"
                          fill={serie.couleur}
                        >
                          <title>
                            {element.nom} - {serie.nom} : {valeur}
                          </title>
                        </rect>
                      )
                    })}

                    <text
                      x={x + largeurBarre / 2}
                      y="210"
                      fill="#999"
                      fontSize="10"
                      textAnchor="middle"
                    >
                      {libellesMois[index] || element.nom}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* LÉGENDE */}
          <div className="flex flex-wrap gap-x-5 gap-y-3 mt-5">
            {series.map((serie) => (
              <div
                key={serie.key}
                className="flex items-center gap-2"
              >
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: serie.couleur,
                  }}
                />

                <span className="text-gray-400 text-xs">
                  {serie.nom}
                </span>
              </div>
            ))}
          </div>

          {aucuneActivite && (
            <p className="text-center text-gray-500 text-sm mt-5">
              Aucune activité enregistrée pour cette année.
            </p>
          )}
        </>
      )}
    </div>
  )
}


// --------------------------------------------------
// TABLEAU DE BORD PRINCIPAL
// --------------------------------------------------

function Dashboard() {
  const admin = lireAdministrateur()

  const [statistiques, setStatistiques] = useState(null)
  const [mouvements, setMouvements] = useState([])
  const [evolution, setEvolution] = useState([])

  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState("")

  const anneeActuelle = new Date().getFullYear()

  // --------------------------------------------------
  // CHARGEMENT DES DONNÉES
  // --------------------------------------------------

  const chargerDashboard = useCallback(async () => {
    setLoading(true)
    setErreur("")

    try {
      const [
        stats,
        activites,
        donneesEvolution,
      ] = await Promise.all([
        apiRequest("/dashboard/statistiques"),

        apiRequest(
          "/dashboard/mouvements-recents?limite=10"
        ),

        apiRequest(
          "/dashboard/evolution-activites"
        ),
      ])

      setStatistiques(stats)
      setMouvements(activites.mouvements || [])
      setEvolution(donneesEvolution.evolution || [])

    } catch (err) {
      setErreur(
        err.message ||
        "Impossible de charger le tableau de bord."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    chargerDashboard()
  }, [chargerDashboard])


  // --------------------------------------------------
  // CARTES STATISTIQUES
  // --------------------------------------------------

  const cartes = [
    {
      titre: "Total véhicules",
      valeur: statistiques?.total_vehicules ?? 0,
      description: "Véhicules enregistrés",
      icone: "🚘",
      couleur: "text-[#D4AF37]",
      fond: "bg-[#D4AF37]/10",
    },
    {
      titre: "Disponibles",
      valeur: statistiques?.disponibles ?? 0,
      description: "Véhicules en vente",
      icone: "✓",
      couleur: "text-green-400",
      fond: "bg-green-500/10",
    },
    {
      titre: "Réservés",
      valeur: statistiques?.reserves ?? 0,
      description: "En attente de vente",
      icone: "◷",
      couleur: "text-yellow-400",
      fond: "bg-yellow-500/10",
    },
    {
      titre: "Vendus",
      valeur: statistiques?.vendus ?? 0,
      description: "Véhicules marqués vendus",
      icone: "✓",
      couleur: "text-blue-400",
      fond: "bg-blue-500/10",
    },
  ]


  // --------------------------------------------------
  // AFFICHAGE
  // --------------------------------------------------

  return (
    <div className="space-y-8">

      {/* EN-TÊTE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[#D4AF37] text-sm font-semibold tracking-widest">
            AUTO DEALS
          </p>

          <h1 className="text-3xl font-bold text-white mt-2">
            Tableau de bord
          </h1>

          <p className="text-gray-400 mt-2">
            Bienvenue, {admin.nom || "Administrateur"}.
            Voici un aperçu de votre activité.
          </p>
        </div>

        <button
          onClick={chargerDashboard}
          disabled={loading}
          className="px-5 py-3 rounded-lg bg-[#D4AF37] text-black font-semibold hover:bg-[#e5c45c] transition disabled:opacity-50"
        >
          {loading ? "Chargement..." : "↻ Actualiser"}
        </button>
      </div>


      {/* ERREUR */}
      {erreur && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4">
          {erreur}
        </div>
      )}


      {/* STATISTIQUES GÉNÉRALES */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">
            Vue générale
          </h2>

          <span className="text-xs text-gray-500">
            Données en temps réel
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {cartes.map((carte) => (
            <div
              key={carte.titre}
              className="bg-[#171717] border border-gray-800 rounded-xl p-6 hover:border-[#D4AF37]/40 transition"
            >
              <div className="flex items-center justify-between">
                <p className="text-gray-400 text-sm">
                  {carte.titre}
                </p>

                <div
                  className={`${carte.fond} w-11 h-11 rounded-lg flex items-center justify-center text-xl`}
                >
                  {carte.icone}
                </div>
              </div>

              <p
                className={`text-3xl font-black mt-5 ${carte.couleur}`}
              >
                {loading
                  ? "..."
                  : erreur && !statistiques
                    ? "—"
                    : carte.valeur}
              </p>

              <p className="text-gray-500 text-sm mt-2">
                {carte.description}
              </p>
            </div>
          ))}
        </div>
      </section>


      {/* RÉPARTITION DU STOCK */}
      <section>
        <StockChart
          statistiques={statistiques}
          loading={loading}
        />
      </section>


      {/* ÉVOLUTION MENSUELLE DES ACTIVITÉS */}
      <section>
        <MonthlyActivityChart
          evolution={evolution}
          loading={loading}
          annee={anneeActuelle}
        />
      </section>


      {/* VALEUR DU STOCK */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2 bg-gradient-to-br from-[#292313] to-[#171717] border border-[#D4AF37]/30 rounded-xl p-7">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center text-2xl">
              💰
            </div>

            <div>
              <p className="text-gray-400 text-sm">
                Valeur du stock disponible
              </p>

              <p className="text-white text-2xl sm:text-3xl font-black mt-1">
                {loading
                  ? "..."
                  : formaterMontant(
                      statistiques?.valeur_stock_disponible
                    )}
              </p>
            </div>
          </div>

          <p className="text-gray-500 text-sm mt-5">
            Valeur cumulée des prix des véhicules actuellement disponibles.
          </p>
        </div>


        <div className="bg-[#171717] border border-gray-800 rounded-xl p-7">
          <p className="text-gray-400 text-sm">
            Valeur des véhicules vendus
          </p>

          <p className="text-white text-2xl font-bold mt-4">
            {loading
              ? "..."
              : formaterMontant(
                  statistiques?.valeur_vehicules_vendus
                )}
          </p>

          <p className="text-gray-500 text-xs mt-3">
            Calculée à partir du prix enregistré dans chaque fiche véhicule.
            Ce montant n'est pas nécessairement le chiffre d'affaires encaissé.
          </p>
        </div>
      </section>


      {/* VALEUR TOTALE DU PARC */}
      <section className="bg-[#171717] border border-gray-800 rounded-xl p-6">
        <p className="text-gray-400 text-sm">
          Valeur totale du parc automobile
        </p>

        <p className="text-3xl font-black text-[#D4AF37] mt-3">
          {loading
            ? "..."
            : formaterMontant(
                statistiques?.valeur_totale_parc
              )}
        </p>

        <p className="text-gray-500 text-sm mt-2">
          Valeur cumulée de tous les véhicules enregistrés.
        </p>
      </section>


      {/* ACTIVITÉS RÉCENTES */}
      <section className="bg-[#171717] border border-gray-800 rounded-xl overflow-hidden">

        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              Activités récentes
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Les 10 dernières opérations effectuées.
            </p>
          </div>

          <span className="text-[#D4AF37] text-sm font-semibold">
            {mouvements.length} opération(s)
          </span>
        </div>


        {loading ? (
          <div className="p-8 text-center text-gray-400">
            Chargement des activités...
          </div>
        ) : erreur && !statistiques ? (
          <div className="p-8 text-center text-gray-400">
            Impossible de charger les activités.
          </div>
        ) : mouvements.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucune activité enregistrée pour le moment.
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {mouvements.map((mouvement) => (
              <div
                key={mouvement.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                    🚘
                  </div>

                  <div>
                    <p className="text-white font-medium">
                      {mouvement.description}
                    </p>

                    <p className="text-gray-500 text-sm mt-1">
                      {mouvement.administrateur_nom ||
                        "Administrateur supprimé"}
                    </p>

                    <p className="text-gray-600 text-xs mt-1">
                      {formaterDate(mouvement.date_creation)}
                    </p>
                  </div>
                </div>


                <div className="flex items-center gap-3 sm:justify-end">
                  {mouvement.vehicule_id && (
                    <span className="text-gray-500 text-xs">
                      Véhicule #{mouvement.vehicule_id}
                    </span>
                  )}

                  <span
                    className={`px-3 py-1 rounded-full border text-xs font-semibold ${couleurAction(mouvement.action)}`}
                  >
                    {mouvement.action}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>


      {/* PIED DE PAGE */}
      <p className="text-center text-gray-600 text-xs pb-4">
        AUTO DEALS — Gestion et administration automobile
      </p>

    </div>
  )
}

export default Dashboard
