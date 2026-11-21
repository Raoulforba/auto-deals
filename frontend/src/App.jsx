
import { useState } from "react"
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useOutletContext
} from "react-router-dom"

import Welcome from "./pages/Welcome"
import Home from "./pages/Home"
import Login from "./admin/pages/Login"
import Dashboard from "./admin/pages/Dashboard"
import AdminLayout from "./admin/layouts/AdminLayout"
import Vehicles from "./admin/pages/Vehicles"
import AddVehicle from "./admin/pages/AddVehicle"
import EditVehicle from "./admin/pages/EditVehicle"
import VehicleDetails from "./admin/pages/VehicleDetails"
import PublicVehicleDetails from "./pages/PublicVehicleDetails"
import Activities from "./admin/pages/Activities"
import Administrateurs from "./admin/pages/Administrateurs"
import Sales from "./admin/pages/Sales"

// Vérification des rôles autorisés
function RoleRoute({ roles, children }) {
  const context = useOutletContext()
  const admin = context?.admin

  if (!admin) {
    return <Navigate to="/admin/login" replace />
  }

  if (!roles.includes(admin.role)) {
    return <Navigate to="/admin/vehicles" replace />
  }

  return children
}

// Site public
function PublicSite() {
  const [showHome, setShowHome] = useState(false)

  return !showHome
    ? <Welcome onEnter={() => setShowHome(true)} />
    : <Home />
}

function App() {
  const rolesModification = [
    "SUPER_ADMIN",
    "ADMINISTRATEUR"
  ]

  return (
    <BrowserRouter>
      <Routes>

        {/* Pages publiques */}
        <Route path="/" element={<PublicSite />} />

        <Route
          path="/vehicule/:id"
          element={<PublicVehicleDetails />}
        />

        {/* Connexion administrateur */}
        <Route
          path="/admin/login"
          element={<Login />}
        />

        {/* Espace administrateur */}
        <Route path="/admin" element={<AdminLayout />}>

          <Route
            index
            element={<Navigate to="dashboard" replace />}
          />

          <Route path="dashboard" element={<Dashboard />} />

          <Route path="vehicles" element={<Vehicles />} />

          <Route
            path="add-vehicle"
            element={
              <RoleRoute roles={rolesModification}>
                <AddVehicle />
              </RoleRoute>
            }
          />

          <Route
            path="edit-vehicle/:id"
            element={
              <RoleRoute roles={rolesModification}>
                <EditVehicle />
              </RoleRoute>
            }
          />

          <Route
            path="vehicle-details/:id"
            element={<VehicleDetails />}
          />

          {/* Module Ventes */}
          <Route
            path="sales"
            element={
              <RoleRoute roles={rolesModification}>
                <Sales />
              </RoleRoute>
            }
          />

          <Route path="activities" element={<Activities />} />

          <Route
            path="administrateurs"
            element={
              <RoleRoute roles={["SUPER_ADMIN"]}>
                <Administrateurs />
              </RoleRoute>
            }
          />

        </Route>

        {/* Route inconnue */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App
