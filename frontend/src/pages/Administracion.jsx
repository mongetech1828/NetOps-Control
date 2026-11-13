import { useEffect, useState } from "react";

function Administracion() {

  const [usuarios, setUsuarios] = useState([]);

  async function crearUsuario() {

    const nombre =
      window.prompt("Nombre");

    if (!nombre) {
      return;
    }

    const correo =
      window.prompt("Correo ICE");

    if (!correo) {
      return;
    }

    const rol =
      window.prompt(
        "Rol (administrador o usuario)",
        "usuario"
      );

    const response = await fetch(
      "/api/perfiles",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          nombre,
          correo,
          rol
        })
      }
    );

    if (!response.ok) {

      alert(
        "No se pudo crear el usuario"
      );

      return;
    }

    await cargarUsuarios();

  }

  async function cambiarEstadoUsuario(
    id,
    activo
  ) {

    const response = await fetch(
      `/api/perfiles/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          activo
        })
      }
    );

    if (!response.ok) {

      alert(
        "No se pudo actualizar el usuario"
      );

      return;
    }

    await cargarUsuarios();

  }

  async function cargarUsuarios() {

    try {

      console.log("CARGANDO USUARIOS");

      const response = await fetch("/api/perfiles");

      console.log("STATUS:", response.status);

      const data = await response.json();

      console.log("DATA:", data);

      setUsuarios(data);

    } catch (error) {

      console.error(
        "ERROR CARGANDO USUARIOS:",
        error
      );

    }
  }

  useEffect(() => {

    console.log("USEEFFECT ADMIN");

    cargarUsuarios();

  }, []);

  return (
    <div>

      <h2>
        Administración de Usuarios
      </h2>

      <p>
        Usuarios cargados: {usuarios.length}
      </p>

      <button
        onClick={crearUsuario}
        style={{
          marginBottom: "20px"
        }}
      >
        + Nuevo Usuario
      </button>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px"
        }}
      >
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>

          {usuarios.map(usuario => (

            <tr key={usuario.id}>

              <td>
                {usuario.nombre}
              </td>

              <td>
                {usuario.correo}
              </td>

              <td>
                {usuario.rol}
              </td>

              <td>
                {usuario.activo
                  ? "Sí"
                  : "No"}
              </td>

              <td>
                <button
                  onClick={() =>
                    cambiarEstadoUsuario(
                      usuario.id,
                      !usuario.activo
                    )
                  }
                >
                  {
                    usuario.activo
                      ? "Desactivar"
                      : "Activar"
                  }
                </button>
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default Administracion;