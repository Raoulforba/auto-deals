
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

function deconnecterUtilisateur() {
  sessionStorage.removeItem("auto_deals_token")
  sessionStorage.removeItem("auto_deals_admin")

  if (window.location.pathname !== "/admin/login") {
    window.location.replace("/admin/login")
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = sessionStorage.getItem("auto_deals_token")

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  // Ne pas imposer Content-Type pour les fichiers multipart.
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401 && token) {
    deconnecterUtilisateur()
    throw new Error("Votre session a expiré. Veuillez vous reconnecter.")
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.detail || "Une erreur est survenue.")
  }

  return data
}
