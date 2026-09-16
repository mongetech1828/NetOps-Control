import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

function Dashboard() {

  const [perfil, setPerfil] = useState(null);
  const [totalOrdenes, setTotalOrdenes] = useState(0);
  const [dentroSLA, setDentroSLA] = useState(0);
  const [porVencer, setPorVencer] = useState(0);
  const [vencidas, setVencidas] = useState(0);

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
    cargarSLA();

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

function diasRestantes(fechaMaxima) {
    const hoy = new Date();
    const fecha = new Date(fechaMaxima);

    const diffTime = fecha - hoy;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

async function cargarSLA() {

  const { data } = await supabase
    .from("ordenes")
    .select("*");

    let contadorDentroSLA = 0;
    let contadorPorVencer = 0;
    let contadorVencidas = 0;

    data.forEach((orden) => {
      const dias = diasRestantes(orden.fecha_maxima_atencion);
      if (dias > 2) {
        contadorDentroSLA++;
      } else if (dias >= 0) {
        contadorPorVencer++;
      } else {
        contadorVencidas++;
      }
    });

    setDentroSLA(contadorDentroSLA);
    setPorVencer(contadorPorVencer);
    setVencidas(contadorVencidas);

    console.log("Dentro SLA:", contadorDentroSLA);
    console.log("Por Vencer:", contadorPorVencer);
    console.log("Vencidas:", contadorVencidas);
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
    <h3>Dentro SLA</h3>
    <h1>{dentroSLA}</h1>
  </div>

  <div style={cardStyle}>
    <h3>Por Vencer</h3>
    <h1>{porVencer}</h1>
  </div>

  <div style={cardStyle}>
    <h3>Vencidas</h3>
    <h1>{vencidas}</h1>
  </div>  

  <div style={cardStyle}>
    <h3>SIGA Pendientes</h3>
    <h1>0</h1>
  </div>

  <div style={cardStyle}>
    <h3>En Campo</h3>
    <h1>0</h1>
  </div>
  </div>
</div>

  );
}

export default Dashboard;