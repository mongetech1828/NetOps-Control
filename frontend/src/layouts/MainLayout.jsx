import { Link } from "react-router-dom";

function MainLayout({
  perfil,
  children,
  onLogout
}) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh"
      }}
    >
      <aside
        style={{
          width: "250px",
          backgroundColor: "#1e293b",
          color: "white",
          padding: "20px"
        }}
      >
        <h2>NetOps Control</h2>

        <hr />

        <p>{perfil?.nombre}</p>
        <p>{perfil?.rol}</p>

        <hr />

        <div>
          <Link to="/">Dashboard</Link>
          <br /><br />
          
          <Link to="/ordenes">Órdenes</Link>
          <br /><br />
          
          <Link to="/siga">SIGA</Link>
          <br /><br />
          
          <Link to="/tecnicos">Técnicos</Link>
          <br /><br />
          
          <Link to="/reportes">Reportes</Link>
        </div>

        <hr />

        <button onClick={onLogout}>
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