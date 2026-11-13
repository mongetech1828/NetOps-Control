import { useEffect, useState } from "react";

function Administracion() {

  const [usuarios, setUsuarios] =
    useState([]);

  async function cargarUsuarios() {

    const response =
      await fetch("/api/perfiles");

    const data =
      await response.json();

    setUsuarios(data);

  }

  useEffect(() => {
    cargarUsuarios();
  }, []);

  return (
    <div>

      <h2>
        Administración de Usuarios
      </h2>

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Activo</th>
          </tr>
        </thead>

        <tbody>
          {
            usuarios.map(usuario => (
              <tr key={usuario.id}>
                <td>{usuario.nombre}</td>
                <td>{usuario.correo}</td>
                <td>{usuario.rol}</td>
                <td>
                  {usuario.activo
                    ? "Sí"
                    : "No"}
                </td>
              </tr>
            ))
          }
        </tbody>

      </table>

    </div>
  );
}

export default Administracion;