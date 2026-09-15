import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

function Dashboard() {

  const [perfil, setPerfil] = useState(null);
  const [totalOrdenes, setTotalOrdenes] = useState(0);

  useEffect(() => {

    async function cargarPerfil() {

      const {
        data: { user }
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", user.id)
        .single();

      console.log(data);
      console.log(error);

      setPerfil(data);

    }

    cargarPerfil();
    cargarKpis();

  }, []);

async function cargarKpis() {

  const { count, error } = await supabase
    .from("ordenes")
    .select("*", {
      count: "exact",
      head: true
    });

  console.log(count);
  console.log(error);

  setTotalOrdenes(count || 0);
}

  const cardStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    padding: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    textAlign: "center",
    };

  async function cerrarSesion() {
    await supabase.auth.signOut();
  }

  return (
    <div>
    <h1>Dashboard</h1>

      <p>
        Bienvenido {perfil?.nombre}
      </p>

      <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "20px",
        marginTop: "30px",
    }}
>
  <div style={cardStyle}>
    <h3>OST Registradas</h3>
    <h1>{totalOrdenes}</h1>
  </div>

  <div style={cardStyle}>
    <h3>SIGA Pendientes</h3>
    <h1>0</h1>
  </div>

  <div style={cardStyle}>
    <h3>En Campo</h3>
    <h1>0</h1>
  </div>

  <div style={cardStyle}>
    <h3>Por Vencer</h3>
    <h1>0</h1>
  </div>
  </div>
</div>

  );
}

export default Dashboard;