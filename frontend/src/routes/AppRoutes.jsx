import { Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import Dashboard from "../pages/Dashboard";
import Ordenes from "../pages/Ordenes";
import SIGA from "../pages/SIGA";
import Tecnicos from "../pages/Tecnicos";
import Reportes from "../pages/Reportes";

function AppRoutes({ perfil, onLogout }) {

  return (
    <MainLayout
      perfil={perfil}
      onLogout={onLogout}
    >
      <Routes>

        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/ordenes"
          element={<Ordenes />}
        />

        <Route
          path="/siga"
          element={<SIGA />}
        />

        <Route
          path="/tecnicos"
          element={<Tecnicos />}
        />

        <Route
          path="/reportes"
          element={<Reportes />}
        />

      </Routes>
    </MainLayout>
  );
}

export default AppRoutes;