import { useEffect, useState } from "react";

function Administracion() {

  const [usuarios, setUsuarios] = useState([]);

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

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default Administracion;