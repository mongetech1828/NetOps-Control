import { useEffect, useState } from "react";

function Administracion() {

  async function cargarUsuarios() {

    console.log("CARGANDO USUARIOS");

    const response = await fetch("/api/perfiles");

    console.log("STATUS:", response.status);

    const data = await response.json();

    console.log("DATA:", data);

    setUsuarios(data);

  }

  useEffect(() => {
    console.log("USEEFFECT ADMIN");

    cargarUsuarios();
  }, []);

  return (
    <div>
      <h1 style={{ color: "red" }}>
        ADMINISTRACION FUNCIONANDO
      </h1>

      <p>
        Usuarios cargados: {usuarios.length}
      </p>

    </div>
  );
}

export default Administracion;