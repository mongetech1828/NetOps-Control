import { Link } from "react-router-dom";

const menuLinkStyle = {
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "18px",
  fontWeight: "500"
};

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
          width: "180px",
          background: "linear-gradient(135deg, #1e3a8a, #0f172a)",
          color: "white",
          padding: "20px"
        }}
      >
        <h2>NetOps Control</h2>

        <hr />

        <p>{perfil?.nombre}</p>
        <p>{perfil?.rol}</p>

        <hr />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "25px",
            alignItems: "center"
          }}
        >
          <Link to="/"
            style={menuLinkStyle}
          >
            Dashboard
          </Link>
          
          <Link to="/ordenes"
            style={menuLinkStyle}
          >
            Órdenes
          </Link>
          
          <Link to="/siga"
            style={menuLinkStyle}
          >
            SIGA
          </Link>
          
          <Link to="/tecnicos"
            style={menuLinkStyle}
          >
            Técnicos
          </Link>
          
          <Link to="/reportes"
            style={menuLinkStyle}
          >
            Reportes
          </Link>
        </div>

        <hr />

        <button 
          style={{
            width: "100%",
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            background: "#2563eb",
            color: "white",
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "15px"
          }}
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