import { useEffect, useState } from "react";
import Login from "./pages/Login";
import AppRoutes from "./routes/AppRoutes";

function App() {

  const [usuario, setUsuario] = useState(null);

  useEffect(() => {

    const usuarioGuardado =
      localStorage.getItem("usuario");

    if (usuarioGuardado) {
      setUsuario(
        JSON.parse(usuarioGuardado)
      );
    }

  }, []);

  function cerrarSesion() {

    localStorage.removeItem("usuario");

    setUsuario(null);

    window.location.reload();

  }

  if (!usuario) {
    return <Login />;
  }

  return (
    <AppRoutes
      perfil={usuario}
      onLogout={cerrarSesion}
    />
  );

}

export default App;