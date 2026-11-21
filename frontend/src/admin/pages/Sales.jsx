
import { useEffect, useState } from "react"
import { apiRequest } from "../../services/api"

function Sales() {
  const [ventes, setVentes] = useState([])
  const [statistiques, setStatistiques] = useState(null)
  const [vehicules, setVehicules] = useState([])

  const [vehiculeId, setVehiculeId] = useState("")
  const [clientNom, setClientNom] = useState("")
  const [clientTelephone, setClientTelephone] = useState("")
  const [prixVente, setPrixVente] = useState("")
  const [paiementConfirme, setPaiementConfirme] = useState(false)

  const [chargement, setChargement] = useState(true)
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreur, setErreur] = useState("")
  const [message, setMessage] = useState("")

  // Charger les ventes, statistiques et véhicules
  const chargerDonnees = async () => {
    try {
      setErreur("")

      const [listeVentes, stats, listeVehicules] = await Promise.all([
        apiRequest("/ventes/"),
        apiRequest("/ventes/statistiques"),
        apiRequest("/vehicules/")
      ])

      setVentes(Array.isArray(listeVentes) ? listeVentes : [])
      setStatistiques(stats)

      setVehicules(
        Array.isArray(listeVehicules)
          ? listeVehicules.filter(
              (v) => ["DISPONIBLE", "RESERVE"].includes(v.statut)
            )
          : []
      )
    } catch (error) {
      setErreur(error.message || "Impossible de charger les données.")
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    chargerDonnees()
  }, [])

  // Véhicule sélectionné
  const vehiculeSelectionne = vehicules.find(
    (v) => String(v.id) === vehiculeId
  )

  // Calcul des prix
  const prixInitial = Number(vehiculeSelectionne?.prix || 0)
  const prixFinal = Number(prixVente || 0)
  const reduction = prixInitial - prixFinal

  // Formatage des montants
  const formaterMontant = (montant) =>
    `${Number(montant || 0).toLocaleString("fr-FR")} FCFA`

  // Formatage des dates
  const formaterDate = (date) =>
    new Date(date).toLocaleDateString("fr-FR")

  // Enregistrer une vente
  const enregistrerVente = async (e) => {
    e.preventDefault()

    setErreur("")
    setMessage("")

    if (!vehiculeSelectionne) {
      setErreur("Veuillez sélectionner un véhicule.")
      return
    }

    if (!clientNom.trim() || !clientTelephone.trim()) {
      setErreur("Veuillez renseigner les informations du client.")
      return
    }

    if (!prixVente || prixFinal <= 0 || prixFinal > prixInitial) {
      setErreur(
        "Le prix de vente doit être positif et inférieur ou égal au prix initial."
      )
      return
    }

    if (!paiementConfirme) {
      setErreur("Veuillez confirmer la réception du paiement intégral.")
      return
    }

    const confirmation = window.confirm(
      `Confirmer la vente de ${vehiculeSelectionne.marque} ${vehiculeSelectionne.modele} pour ${formaterMontant(prixFinal)} ?`
    )

    if (!confirmation) return

    try {
      setEnregistrement(true)

      await apiRequest("/ventes/", {
        method: "POST",
        body: JSON.stringify({
          vehicule_id: vehiculeSelectionne.id,
          client_nom: clientNom.trim(),
          client_telephone: clientTelephone.trim(),
          prix_vente: prixFinal,
          paiement_integral_confirme: paiementConfirme
        })
      })

      setMessage(
        "Vente enregistrée avec succès. Le véhicule est maintenant vendu."
      )

      // Réinitialiser le formulaire
      setVehiculeId("")
      setClientNom("")
      setClientTelephone("")
      setPrixVente("")
      setPaiementConfirme(false)

      // Actualiser les données
      await chargerDonnees()

    } catch (error) {
      setErreur(error.message || "Impossible d'enregistrer la vente.")
    } finally {
      setEnregistrement(false)
    }
  }

  if (chargement) {
    return (
      <div className="text-[#D4AF37] text-center py-20">
        Chargement des ventes...
      </div>
    )
  }

  return (
    <div className="space-y-8 text-white">

      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-black text-[#D4AF37]">
          Gestion des ventes
        </h1>

        <p className="text-gray-400 mt-2">
          Enregistrement et suivi des ventes AUTO DEALS.
        </p>
      </div>

      {/* Messages */}
      {erreur && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-xl">
          {erreur}
        </div>
      )}

      {message && (
        <div className="bg-green-900/30 border border-green-700 text-green-300 p-4 rounded-xl">
          {message}
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

        <div className="bg-[#161616] border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">
            Total des ventes
          </p>

          <p className="text-3xl font-bold mt-3">
            {statistiques?.total_ventes ?? 0}
          </p>
        </div>

        <div className="bg-[#161616] border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">
            Chiffre d'affaires
          </p>

          <p className="text-xl font-bold text-[#D4AF37] mt-3">
            {formaterMontant(statistiques?.chiffre_affaires)}
          </p>
        </div>

        <div className="bg-[#161616] border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">
            Prix moyen
          </p>

          <p className="text-xl font-bold mt-3">
            {formaterMontant(statistiques?.prix_moyen)}
          </p>
        </div>

        <div className="bg-[#161616] border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">
            Réductions accordées
          </p>

          <p className="text-xl font-bold text-green-400 mt-3">
            {formaterMontant(statistiques?.total_reductions)}
          </p>
        </div>

      </div>

      {/* Formulaire d'enregistrement */}
      <div className="bg-[#161616] border border-gray-800 rounded-xl p-6">

        <h2 className="text-xl font-bold text-[#D4AF37] mb-6">
          Enregistrer une vente
        </h2>

        <form onSubmit={enregistrerVente} className="space-y-5">

          {/* Sélection du véhicule */}
          <div>
            <label className="block text-gray-300 mb-2">
              Véhicule *
            </label>

            <select
              value={vehiculeId}
              onChange={(e) => {
                setVehiculeId(e.target.value)
                setPrixVente("")
              }}
              className="w-full bg-[#222] border border-gray-700 rounded-lg p-3 text-white"
              required
            >
              <option value="">
                Sélectionner un véhicule
              </option>

              {vehicules.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.marque} {v.modele} ({v.annee}) — {v.statut}
                </option>
              ))}
            </select>

            {vehicules.length === 0 && (
              <p className="text-yellow-500 text-sm mt-2">
                Aucun véhicule disponible ou réservé.
              </p>
            )}
          </div>

          {/* Informations du véhicule */}
          {vehiculeSelectionne && (
            <div className="bg-[#222] border border-gray-700 rounded-lg p-4">

              <p className="text-gray-400 text-sm">
                Prix initial du véhicule
              </p>

              <p className="text-2xl font-bold text-[#D4AF37] mt-1">
                {formaterMontant(prixInitial)}
              </p>

              <p className="text-gray-400 text-sm mt-2">
                Statut : {vehiculeSelectionne.statut}
              </p>

            </div>
          )}

          {/* Informations du client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <label className="block text-gray-300 mb-2">
                Nom du client *
              </label>

              <input
                type="text"
                value={clientNom}
                onChange={(e) => setClientNom(e.target.value)}
                placeholder="Nom complet du client"
                maxLength={150}
                required
                className="w-full bg-[#222] border border-gray-700 rounded-lg p-3 text-white"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">
                Téléphone WhatsApp *
              </label>

              <input
                type="tel"
                value={clientTelephone}
                onChange={(e) => setClientTelephone(e.target.value)}
                placeholder="Ex : 691234567"
                maxLength={30}
                required
                className="w-full bg-[#222] border border-gray-700 rounded-lg p-3 text-white"
              />
            </div>

          </div>

          {/* Prix de vente */}
          <div>
            <label className="block text-gray-300 mb-2">
              Prix final négocié (FCFA) *
            </label>

            <input
              type="number"
              min="1"
              max={prixInitial || undefined}
              step="1"
              value={prixVente}
              onChange={(e) => setPrixVente(e.target.value)}
              placeholder="Saisir le prix de vente"
              required
              disabled={!vehiculeSelectionne}
              className="w-full bg-[#222] border border-gray-700 rounded-lg p-3 text-white disabled:opacity-40"
            />
          </div>

          {/* Calcul automatique */}
          {vehiculeSelectionne && prixVente && prixFinal > 0 && (
            <div className="bg-[#222] border border-gray-700 rounded-lg p-4 space-y-3">

              <div className="flex justify-between gap-4">
                <span className="text-gray-400">
                  Prix initial
                </span>

                <span>
                  {formaterMontant(prixInitial)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-400">
                  Prix final
                </span>

                <span className="text-[#D4AF37] font-bold">
                  {formaterMontant(prixFinal)}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-t border-gray-700 pt-3">
                <span className="text-gray-400">
                  Réduction
                </span>

                <span className="text-green-400 font-bold">
                  {formaterMontant(reduction)}
                </span>
              </div>

            </div>
          )}

          {/* Confirmation du paiement */}
          <label className="flex items-start gap-3 bg-[#222] border border-gray-700 rounded-lg p-4 cursor-pointer">

            <input
              type="checkbox"
              checked={paiementConfirme}
              onChange={(e) => setPaiementConfirme(e.target.checked)}
              className="mt-1 accent-yellow-500"
            />

            <span className="text-sm text-gray-300">
              Je confirme que le paiement intégral du véhicule a été reçu.
            </span>

          </label>

          {/* Bouton de validation */}
          <button
            type="submit"
            disabled={enregistrement || vehicules.length === 0}
            className="w-full md:w-auto bg-[#D4AF37] text-black font-bold px-8 py-3 rounded-lg hover:bg-yellow-500 disabled:opacity-50"
          >
            {enregistrement
              ? "Enregistrement..."
              : "Confirmer et enregistrer la vente"}
          </button>

        </form>
      </div>

      {/* Historique des ventes */}
      <div className="bg-[#161616] border border-gray-800 rounded-xl overflow-hidden">

        <div className="p-5 border-b border-gray-800 flex flex-wrap justify-between items-center gap-3">

          <h2 className="text-xl font-bold">
            Historique des ventes
          </h2>

          <button
            type="button"
            onClick={chargerDonnees}
            className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-semibold"
          >
            Actualiser
          </button>

        </div>

        {ventes.length === 0 ? (
          <div className="text-center py-16 px-5">

            <p className="text-gray-300 text-lg">
              Aucune vente enregistrée
            </p>

            <p className="text-gray-500 text-sm mt-2">
              Les ventes apparaîtront ici après leur enregistrement.
            </p>

          </div>
        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left min-w-[800px]">

              <thead className="bg-[#202020] text-gray-400 text-sm">
                <tr>
                  <th className="p-4">Véhicule</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Prix initial</th>
                  <th className="p-4">Prix de vente</th>
                  <th className="p-4">Réduction</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>

              <tbody>

                {ventes.map((vente) => (
                  <tr
                    key={vente.id}
                    className="border-t border-gray-800"
                  >

                    <td className="p-4">
                      {vente.vehicule_marque} {vente.vehicule_modele} ({vente.vehicule_annee})
                    </td>

                    <td className="p-4">
                      <p>{vente.client_nom}</p>

                      <p className="text-gray-500 text-sm">
                        {vente.client_telephone}
                      </p>
                    </td>

                    <td className="p-4">
                      {formaterMontant(vente.prix_initial)}
                    </td>

                    <td className="p-4 text-[#D4AF37] font-semibold">
                      {formaterMontant(vente.prix_vente)}
                    </td>

                    <td className="p-4 text-green-400">
                      {formaterMontant(
                        Number(vente.prix_initial) -
                        Number(vente.prix_vente)
                      )}
                    </td>

                    <td className="p-4">
                      {formaterDate(vente.date_vente)}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  )
}

export default Sales
