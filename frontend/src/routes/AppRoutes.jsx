import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const Ordenes = lazy(() => import("../pages/Ordenes"));
const SIGA = lazy(() => import("../pages/SIGA"));
const Tecnicos = lazy(() => import("../pages/Tecnicos"));
const ReporteAgentes = lazy(() => import("../pages/ReporteAgentes"));
const Reportes = lazy(() => import("../pages/Reportes"));
const Administracion = lazy(() => import("../pages/Administracion"));

function AppRoutes({ perfil, onLogout }) {

  return (
    <MainLayout
      perfil={perfil}
      onLogout={onLogout}
    >
      <Suspense fallback={<div role="status">Cargando página...</div>}>
        <Routes>

          <Route
            path="/"
            element={<Dashboard
              perfil={perfil}
            />}
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
            path="/reporte-agentes"
            element={<ReporteAgentes />}
          />

          <Route
            path="/reportes"
            element={<Reportes />}
          />

          <Route
            path="/administracion"
            element={<Administracion />}
          />

        </Routes>
      </Suspense>
    </MainLayout>
  );
}

export default AppRoutes;