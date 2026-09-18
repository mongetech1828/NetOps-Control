import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

function Dashboard() {

  const [perfil, setPerfil] = useState(null);
  const [totalOrdenes, setTotalOrdenes] = useState(0);
  const [dentroSLA, setDentroSLA] = useState(0);
  const [porVencer, setPorVencer] = useState(0);
  const [vencidas, setVencidas] = useState(0);
  const [totalReingresadas, setTotalReingresadas] = useState (0);
  const [vencenHoy, setVencenHoy] = useState(0);
  const [enCampo, setEnCampo] = useState(0);
  const [mostrarVencenHoy, setMostrarVencenHoy] = useState(false);
  const [ordenesVencenHoy, setOrdenesVencenHoy] = useState([]);
  const [mostrarReingresadas, setMostrarReingresadas] = useState(false);
  const [ordenesReingresadas, setOrdenesReingresadas] = useState([]);
  const [mostrarEnCampo, setMostrarEnCampo] = useState(false);
  const [ordenesEnCampo, setOrdenesEnCampo] = useState([]);
  const [mostrarPorVencer, setMostrarPorVencer] = useState(false);
  const [ordenesPorVencer, setOrdenesPorVencer] = useState([]);
  const [mostrarVencidas, setMostrarVencidas] = useState(false);
  const [ordenesVencidas, setOrdenesVencidas] = useState([]);

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

  function formatearFechaDB(fecha) {

    const anio = fecha.getFullYear();

    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
      fecha.getDate()
    ).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
  }

  async function cargarKpis() {

    // Total órdenes
    const { count, error } = await supabase
      .from("ordenes")
      .select("*", {
        count: "exact",
        head: true
      });

    setTotalOrdenes(count || 0);

    // Órdenes reingresadas
    const {
      count: reingresadas,
      error: errorReingresadas
    } = await supabase
      .from("ordenes")
      .select("*", {
        count: "exact",
        head: true
      })
      .gt("cantidad_reingresos", 0);

    if (errorReingresadas) {
      console.error(errorReingresadas);
    } else {
      setTotalReingresadas(
        reingresadas || 0
      );
    }

    // Órdenes Vencen hoy
    const hoy = formatearFechaDB(
      new Date()
    );

    const {
      count: totalVencenHoy,
      error: errorVencenHoy
    } = await supabase
      .from("ordenes")
      .select("*", {
        count: "exact",
        head: true
      })
      .eq("fecha_maxima_atencion", hoy);

    if (errorVencenHoy) {
      console.error(errorVencenHoy);
    } else {
      setVencenHoy(
        totalVencenHoy || 0
      );
    }

    // Órdenes En campo
    const {
      count: totalEnCampo,
      error: errorEnCampo
    } = await supabase

      .from("ordenes")
      .select("*", {
        count: "exact",
        head: true
      })
    .eq("estado_id", 7);

    console.log("totalEnCampo:", totalEnCampo);
    console.log("errorEnCampo:", errorEnCampo);

    if (errorEnCampo) {
      console.error(errorEnCampo);
    } else {
      setEnCampo(totalEnCampo || 0);
    }
  }

  // Mostrar Ordenes Vencen Hoy
  async function mostrarOrdenesHoy() {

    const hoy = formatearFechaDB(
      new Date()
    );

    const { data, error } = await supabase
      .from("ordenes")
      .select("*")
      .eq("fecha_maxima_atencion", hoy);

    if (error) {
      console.error(error);
      return;
    }

    setOrdenesVencenHoy(data);
    setMostrarVencenHoy(true);
  }

  //Mostrar Ordenes reingresadas
  async function mostrarReingresos() {

    const { data, error } = await supabase
      .from("ordenes")
      .select("*")
      .gt("cantidad_reingresos", 0);

    if (error) {
      console.error(error);
      return;
    }

    setOrdenesReingresadas(data);
    setMostrarReingresadas(true);
  }

  //Mostrar Ordenes en campo
  async function mostrarOrdenesEnCampo() {

    const { data, error } = await supabase
      .from("ordenes")
      .select("*")
      .eq("estado_id", 7);

    if (error) {
      console.error(error);
      return;
    }

    setOrdenesEnCampo(data);
    setMostrarEnCampo(true);
  }

  //Mostrar Ordenes Por Vencer
  async function mostrarOrdenesPorVencer() {

    const { data, error } = await supabase
      .from("ordenes")
      .select("*");

    if (error) {
      console.error(error);
      return;
    }

    const filtradas = data.filter((orden) => {

      const dias = diasRestantes(
        orden.fecha_maxima_atencion
      );

      return dias === 2;
    });

    setOrdenesPorVencer(filtradas);
    setMostrarPorVencer(true);
  }

  //Mostrar Ordenes Vencidas
  async function mostrarOrdenesVencidas() {

    const { data, error } = await supabase
      .from("ordenes")
      .select("*");

    if (error) {
      console.error(error);
      return;
    }

    const filtradas = data.filter((orden) => {

      const dias = diasRestantes(
        orden.fecha_maxima_atencion
      );

      return dias < 0;
    });

    setOrdenesVencidas(filtradas);
    setMostrarVencidas(true);
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
      } else if (dias === 2) {
        contadorPorVencer++;
      } else if (dias === 0) {
        // Vencen Hoy
      } else if (dias < 0) { 
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

        <div style={{
            ...cardStyle,
            cursor: "pointer"
          }}
          onClick={mostrarOrdenesPorVencer}
        >
          <h3>Por Vencer</h3>
          <h1>{porVencer}</h1>
        </div>

        <div style={{
            ...cardStyle, 
            cursor: "pointer"
          }} 
          onClick={mostrarOrdenesHoy}
        >
          <h3>Vencen Hoy</h3>
          <h1>{vencenHoy}</h1>
        </div>

        <div style={{
            ...cardStyle,
            cursor: "pointer"
          }}
          onClick={mostrarOrdenesVencidas}
        >
          <h3>Vencidas</h3>
          <h1>{vencidas}</h1>
        </div>

        <div style={{
            ...cardStyle,
            cursor: "pointer"
          }}
          onClick={mostrarReingresos}
        >
          <h3>Órdenes Reingresadas</h3>
          <h1>{totalReingresadas}</h1>
        </div>        

        <div style={cardStyle}>
          <h3>SIGA Pendientes</h3>
          <h1>0</h1>
        </div>

        <div style={{
            ...cardStyle,
            cursor: "pointer"
          }}
            onClick={mostrarOrdenesEnCampo}
        >
          <h3>En Campo</h3>
          <h1>{enCampo}</h1>
        </div>
      </div>

      {
        mostrarVencenHoy && (
          <div className="modal-overlay">
            <div className="modal-content">

              <h3>
                Órdenes que vencen hoy
              </h3>

              <table>
                <thead>
                  <tr>
                    <th>OST</th>
                    <th>Cliente</th>
                    <th>Fecha Máxima</th>
                  </tr>
                </thead>

                <tbody>
                  {ordenesVencenHoy.map((orden) => (
                    <tr key={orden.id}>
                      <td>
                        {orden.numero_ost}
                      </td>
                      <td>
                        {orden.cliente}
                      </td>
                      <td>
                        {new Date(
                          orden.fecha_maxima_atencion
                        ).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                onClick={() =>
                  setMostrarVencenHoy(false)
                }
              >
                  Cerrar
              </button>

            </div>
          </div>
        )
      }

      {
        mostrarReingresadas && (
          <div className="modal-overlay">
            <div className="modal-content">

              <h3>
                Órdenes Reingresadas
              </h3>

              <table>

                <thead>
                  <tr>
                    <th>OST</th>
                    <th>Cliente</th>
                    <th>Reingresos</th>
                  </tr>
                </thead>

                <tbody>
                  {ordenesReingresadas.map((orden) => (
                    <tr key={orden.id}>
                      <td>{orden.numero_ost}</td>
                      <td>{orden.cliente}</td>
                      <td>{orden.cantidad_reingresos}</td>
                    </tr>
                  ))}
                </tbody>

              </table>

              <button
                onClick={() =>
                  setMostrarReingresadas(false)
                }
              >
                Cerrar
              </button>

            </div>
          </div>
        )
      }

      {
        mostrarEnCampo && (
          <div className="modal-overlay">
            <div className="modal-content">

              <h3>
                Órdenes En Campo
              </h3>

              <table>
                <thead>
                  <tr>
                    <th>OST</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {ordenesEnCampo.map((orden) => (
                    <tr key={orden.id}>
                      <td>{orden.numero_ost}</td>
                      <td>{orden.cliente}</td>
                      <td>En Campo</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                onClick={() =>
                  setMostrarEnCampo(false)
                }
              >
                Cerrar
              </button>
            </div>
          </div>
        )
      }

      {
        mostrarPorVencer && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Órdenes Por Vencer</h3>

              <table>
                <thead>
                  <tr>
                    <th>OST</th>
                    <th>Cliente</th>
                    <th>Días</th>
                  </tr>
                </thead>

                <tbody>
                  {ordenesPorVencer.map((orden) => (
                    <tr key={orden.id}>
                      <td>{orden.numero_ost}</td>
                      <td>{orden.cliente}</td>
                      <td>
                        {
                          diasRestantes(
                            orden.fecha_maxima_atencion
                          )
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                onClick={() =>
                  setMostrarPorVencer(false)
                }
              >
                Cerrar
              </button>
            </div>
          </div>
        )
      }

      {
        mostrarVencidas && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Órdenes Vencidas</h3>

              <table>
                <thead>
                  <tr>
                    <th>OST</th>
                    <th>Cliente</th>
                    <th>Días Vencida</th>
                  </tr>
                </thead>

                <tbody>
                  {ordenesVencidas.map((orden) => (
                    <tr key={orden.id}>
                      <td>{orden.numero_ost}</td>
                      <td>{orden.cliente}</td>
                      <td>
                        {Math.abs(
                          diasRestantes(
                            orden.fecha_maxima_atencion
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                onClick={() =>
                  setMostrarVencidas(false)
                }
              >
                Cerrar
              </button>
            </div>
          </div>
        )
      }

    </div>

  );
}

export default Dashboard;