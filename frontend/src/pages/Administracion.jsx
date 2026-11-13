import { useEffect, useState } from "react";

function Administracion() {

  async function cargarUsuarios() {

    console.log("CARGANDO USUARIOS");

    const response =
      await fetch("/api/perfiles");

    console.log(
      "STATUS:",
      response.status
    );

    const data =
      await response.json();

    console.log(
      "USUARIOS:",
      data
    );

    setUsuarios(data);

  }

  return (
    <div>
      <h1 style={{ color: "red" }}>
        ADMINISTRACION FUNCIONANDO
      </h1>
    </div>
  );
}

export default Administracion;