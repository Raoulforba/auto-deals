
import { useCallback, useEffect, useState } from "react"
import { apiRequest } from "../../services/api"

const FORM_INITIAL = {
  nom: "",
  email: "",
  mot_de_passe: "",
  role: "ADMINISTRATEUR",
}

function Administrateurs() {
  const [administrateurs, setAdministrateurs] = useState([])
  const [formulaire, setFormulaire] = useState(FORM_INITIAL)
  const [adminEnEdition, setAdminEnEdition] = useState(null)
  const [recherche, setRecherche] = useState("")
  const [modalOuvert, setModalOuvert] = useState(false)
  const [chargement, setChargement] = useState(true)
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreur, setErreur] = useState("")
  const [message, setMessage] = useState("")

  const chargerAdministrateurs = useCallback(async () => {
    try {
      setChargement(true)
      setErreur("")

      const data = await apiRequest("/administrateurs/")
      setAdministrateurs(data)
    } catch (error) {
      setErreur(error.message || "Impossible de charger les administrateurs.")
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    chargerAdministrateurs()
  }, [chargerAdministrateurs])

  const ouvrirCreation = () => {
    setAdminEnEdition(null)
    setFormulaire(FORM_INITIAL)
    setErreur("")
    setModalOuvert(true)
  }

  const ouvrirModification = (admin) => {
    setAdminEnEdition(admin)
    setFormulaire({
      nom: admin.nom,
      email: admin.email,
      mot_de_passe: "",
      role: admin.role,
    })
    setErreur("")
    setModalOuvert(true)
  }

  const fermerModal = () => {
    setModalOuvert(false)
    setAdminEnEdition(null)
    setFormulaire(FORM_INITIAL)
    setErreur("")
  }

  const gererChangement = (e) => {
    const { name, value } = e.target

    setFormulaire((ancien) => ({
      ...ancien,
      [name]: value,
    }))
  }

  const enregistrer = async (e) => {
    e.preventDefault()
    setErreur("")
    setMessage("")

    const donnees = {
      nom: formulaire.nom.trim(),
      email: formulaire.email.trim().toLowerCase(),
      role: formulaire.role,
    }

    if (!adminEnEdition || formulaire.mot_de_passe.trim()) {
      donnees.mot_de_passe = formulaire.mot_de_passe
    }

    try {
      setEnregistrement(true)

      if (adminEnEdition) {
        await apiRequest(`/administrateurs/${adminEnEdition.id}`, {
          method: "PUT",
          body: JSON.stringify(donnees),
        })
        setMessage("Administrateur modifié avec succès.")
      } else {
        await apiRequest("/administrateurs/", {
          method: "POST",
          body: JSON.stringify(donnees),
        })
        setMessage("Administrateur créé avec succès.")
      }

      fermerModal()
      await chargerAdministrateurs()
    } catch (error) {
      setErreur(error.message || "Une erreur est survenue.")
    } finally {
      setEnregistrement(false)
    }
  }

  const changerStatut = async (admin) => {
    const nouveauStatut = !admin.actif

    const confirmation = window.confirm(
      nouveauStatut
        ? `Réactiver le compte de ${admin.nom} ?`
        : `Désactiver le compte de ${admin.nom} ?`
    )

    if (!confirmation) return

    try {
      setErreur("")
      setMessage("")

      await apiRequest(
        `/administrateurs/${admin.id}/statut?actif=${nouveauStatut}`,
        { method: "PATCH" }
      )

      setMessage(
        nouveauStatut
          ? "Compte réactivé avec succès."
          : "Compte désactivé avec succès."
      )

      await chargerAdministrateurs()
    } catch (error) {
      setErreur(error.message || "Impossible de modifier le statut.")
    }
  }

  const supprimer = async (admin) => {
    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer le compte de ${admin.nom} ? Cette action est définitive.`
    )

    if (!confirmation) return

    try {
      setErreur("")
      setMessage("")

      await apiRequest(`/administrateurs/${admin.id}`, {
        method: "DELETE",
      })

      setMessage("Administrateur supprimé avec succès.")
      await chargerAdministrateurs()
    } catch (error) {
      setErreur(error.message || "Impossible de supprimer ce compte.")
    }
  }

  const administrateursFiltres = administrateurs.filter((admin) => {
    const terme = recherche.toLowerCase()

    return (
      admin.nom.toLowerCase().includes(terme) ||
      admin.email.toLowerCase().includes(terme) ||
      admin.role.toLowerCase().includes(terme)
    )
  })

  const nombreActifs = administrateurs.filter((a) => a.actif).length
  const nombreInactifs = administrateurs.length - nombreActifs

  const badgeRole = (role) => {
    if (role === "SUPER_ADMIN") {
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    }

    if (role === "ADMINISTRATEUR") {
      return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }

    return "bg-gray-500/20 text-gray-300 border-gray-500/30"
  }

  return (
    <div className="space-y-8 text-white">

      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <p className="text-[#D4AF37] text-sm font-semibold tracking-widest uppercase">
            Administration
          </p>

          <h1 className="text-3xl font-black mt-2">
            Gestion des administrateurs
          </h1>

          <p className="text-gray-400 mt-2">
            Gérez les comptes et les accès à AUTO DEALS.
          </p>
        </div>

        <button
          onClick={ouvrirCreation}
          className="bg-[#D4AF37] hover:bg-[#e8c65b] text-black font-bold px-6 py-3 rounded-xl transition"
        >
          + Ajouter un administrateur
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl">
          {message}
        </div>
      )}

      {erreur && !modalOuvert && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl">
          {erreur}
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

        <div className="bg-[#121212] border border-gray-800 rounded-2xl p-6">
          <p className="text-gray-400 text-sm">Total des comptes</p>
          <p className="text-3xl font-black text-[#D4AF37] mt-3">
            {administrateurs.length}
          </p>
        </div>

        <div className="bg-[#121212] border border-gray-800 rounded-2xl p-6">
          <p className="text-gray-400 text-sm">Comptes actifs</p>
          <p className="text-3xl font-black text-green-400 mt-3">
            {nombreActifs}
          </p>
        </div>

        <div className="bg-[#121212] border border-gray-800 rounded-2xl p-6">
          <p className="text-gray-400 text-sm">Comptes désactivés</p>
          <p className="text-3xl font-black text-red-400 mt-3">
            {nombreInactifs}
          </p>
        </div>

      </div>

      {/* Recherche */}
      <div className="bg-[#121212] border border-gray-800 rounded-2xl p-5">
        <label className="block text-sm text-gray-400 mb-3">
          Rechercher un administrateur
        </label>

        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Nom, email ou rôle..."
          className="w-full bg-[#080808] border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
        />
      </div>

      {/* Tableau */}
      <div className="bg-[#121212] border border-gray-800 rounded-2xl overflow-hidden">

        <div className="p-5 border-b border-gray-800">
          <h2 className="font-bold text-lg">
            Liste des administrateurs
          </h2>
        </div>

        {chargement ? (
          <div className="p-10 text-center text-[#D4AF37]">
            Chargement des comptes...
          </div>
        ) : administrateursFiltres.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            Aucun administrateur trouvé.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">

              <thead className="bg-[#1b1b1b] text-gray-400 text-sm">
                <tr>
                  <th className="p-4">Administrateur</th>
                  <th className="p-4">Rôle</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4">Date de création</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {administrateursFiltres.map((admin) => (
                  <tr
                    key={admin.id}
                    className="border-t border-gray-800 hover:bg-[#1b1b1b]"
                  >
                    <td className="p-4">
                      <p className="font-semibold">{admin.nom}</p>
                      <p className="text-gray-500 text-sm break-all">
                        {admin.email}
                      </p>
                    </td>

                    <td className="p-4">
                      <span className={`inline-block border rounded-full px-3 py-1 text-xs font-semibold ${badgeRole(admin.role)}`}>
                        {admin.role}
                      </span>
                    </td>

                    <td className="p-4">
                      {admin.actif ? (
                        <span className="text-green-400 text-sm">
                          ● Actif
                        </span>
                      ) : (
                        <span className="text-red-400 text-sm">
                          ● Désactivé
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-gray-400 text-sm">
                      {new Date(admin.date_creation).toLocaleDateString("fr-FR")}
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">

                        {admin.role !== "SUPER_ADMIN" && (
                          <>
                            <button
                              onClick={() => ouvrirModification(admin)}
                              className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-2 rounded-lg text-sm hover:bg-blue-500/20"
                            >
                              Modifier
                            </button>

                            <button
                              onClick={() => changerStatut(admin)}
                              className={`border px-3 py-2 rounded-lg text-sm ${
                                admin.actif
                                  ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                                  : "bg-green-500/10 text-green-400 border-green-500/30"
                              }`}
                            >
                              {admin.actif ? "Désactiver" : "Activer"}
                            </button>

                            <button
                              onClick={() => supprimer(admin)}
                              className="bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-2 rounded-lg text-sm hover:bg-red-500/20"
                            >
                              Supprimer
                            </button>
                          </>
                        )}

                        {admin.role === "SUPER_ADMIN" && (
                          <span className="text-gray-500 text-xs">
                            Compte principal protégé
                          </span>
                        )}

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </div>

      {/* Fenêtre de création et modification */}
      {modalOuvert && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">

          <div className="bg-[#151515] border border-gray-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">
                  {adminEnEdition ? "Modifier un compte" : "Créer un compte"}
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  Informations de l'administrateur
                </p>
              </div>

              <button
                onClick={fermerModal}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={enregistrer} className="p-6 space-y-5">

              {erreur && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
                  {erreur}
                </div>
              )}

              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Nom complet
                </label>

                <input
                  type="text"
                  name="nom"
                  value={formulaire.nom}
                  onChange={gererChangement}
                  required
                  minLength={2}
                  maxLength={100}
                  className="w-full bg-[#080808] border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37]"
                  placeholder="Nom de l'administrateur"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Adresse e-mail
                </label>

                <input
                  type="email"
                  name="email"
                  value={formulaire.email}
                  onChange={gererChangement}
                  required
                  className="w-full bg-[#080808] border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37]"
                  placeholder="exemple@email.com"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  {adminEnEdition
                    ? "Nouveau mot de passe (facultatif)"
                    : "Mot de passe"}
                </label>

                <input
                  type="password"
                  name="mot_de_passe"
                  value={formulaire.mot_de_passe}
                  onChange={gererChangement}
                  required={!adminEnEdition}
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full bg-[#080808] border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37]"
                  placeholder="Minimum 8 caractères"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Rôle
                </label>

                <select
                  name="role"
                  value={formulaire.role}
                  onChange={gererChangement}
                  className="w-full bg-[#080808] border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37]"
                >
                  <option value="ADMINISTRATEUR">
                    ADMINISTRATEUR
                  </option>

                  <option value="CONSULTATION">
                    CONSULTATION
                  </option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-3">

                <button
                  type="button"
                  onClick={fermerModal}
                  disabled={enregistrement}
                  className="flex-1 border border-gray-700 text-gray-300 rounded-xl py-3 hover:bg-[#222] disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={enregistrement}
                  className="flex-1 bg-[#D4AF37] text-black font-bold rounded-xl py-3 hover:bg-[#e8c65b] disabled:opacity-50"
                >
                  {enregistrement
                    ? "Enregistrement..."
                    : adminEnEdition
                      ? "Enregistrer les modifications"
                      : "Créer le compte"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Administrateurs
