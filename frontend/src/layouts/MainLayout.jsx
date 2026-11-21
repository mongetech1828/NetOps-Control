import { NavLink } from "react-router-dom";

function MainLayout({
  perfil,
  children,
  onLogout
}) {

  const usuario = JSON.parse(
    localStorage.getItem("usuario")
  );

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh"
      }}
    >
      <aside className="main-sidebar">
        <h2 className="sidebar-brand">PMOST EASE</h2>

        <hr className="sidebar-divider" />

        <div className="sidebar-user">
          <p className="sidebar-user-name">{perfil?.nombre}</p>
          <p className="sidebar-user-role">{perfil?.rol}</p>
        </div>

        <hr className="sidebar-divider" />

        <nav className="sidebar-nav" aria-label="Navegación principal">
          <NavLink to="/" className="sidebar-link">
            Dashboard
          </NavLink>
          
          <NavLink to="/ordenes" className="sidebar-link">
            Órdenes
          </NavLink>
          
          <NavLink to="/siga" className="sidebar-link">
            SIGA
          </NavLink>
          
          <NavLink to="/tecnicos" className="sidebar-link">
            Técnicos
          </NavLink>
          
          <NavLink to="/reportes" className="sidebar-link">
            Reportes
          </NavLink>

          {
            usuario?.rol === "administrador" && (
              <NavLink to="/administracion" className="sidebar-link">
                Administración
              </NavLink>
            )
          }
        </nav>

        <button 
          className="sidebar-logout"
          onClick={onLogout}>
          Cerrar Sesión
        </button>
      </aside>

      <main
        style={{
          flex: 1,
          padding: "20px"
        }}
      >
        {children}

      </main>
    </div>
  );
}

export default MainLayout;