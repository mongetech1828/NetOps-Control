import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";

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
  const [sigas, setSigas] = useState([]);
  const [sigasDentroSLA, setSigasDentroSLA] = useState(0);
  const [sigasEnCampo, setSigasEnCampo] = useState(0);
  const [sigasPorVencer, setSigasPorVencer] = useState(0);
  const [sigasVencidos, setSigasVencidos] = useState(0);
  const [busquedaGlobal, setBusquedaGlobal] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);

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
    cargarSigasDashboard();

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

  function horasRestantesSIGA(fechaMaxima) {
    const ahora = new Date();
    const fechaLimite = new Date(
      fechaMaxima
    );
    const diferencia =
      fechaLimite - ahora;
    return diferencia / (1000 * 60 * 60);
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

    const { data: sigasData, error: errorSigas } =
      await supabase
        .from("sigas")
        .select(`*,estados_siga(nombre)`);

    if (errorSigas) {
      console.error(errorSigas);
    }
    else {

      console.log("SIGAS DATA:", sigasData);

      const dentroSLA =
        sigasData.filter((siga) =>
          siga.estados_siga?.nombre !== "Cerrado" &&
          siga.estados_siga?.nombre !== "Diferido" &&
          horasRestantesSIGA(
            siga.fecha_maxima_atencion
          ) > 1
        ).length;

      const porVencer =
        sigasData.filter((siga) => {
          const horas =
            horasRestantesSIGA(
              siga.fecha_maxima_atencion
            );
          return (
            siga.estados_siga?.nombre !== "Cerrado" &&
            siga.estados_siga?.nombre !== "Diferido" &&
            horas <= 1 &&
            horas > 0
          );
        }).length;

      const vencidos =
        sigasData.filter((siga) =>
          siga.estados_siga?.nombre !== "Cerrado" &&
          horasRestantesSIGA(
            siga.fecha_maxima_atencion
          ) < 0
        ).length;

      const enCampo =
        sigasData.filter((siga) =>
          siga.tecnico_id &&
          siga.estados_siga?.nombre !== "Cerrado" &&
          siga.estados_siga?.nombre !== "Abierto - Verificación"
        ).length;

      setSigasDentroSLA(dentroSLA);
      setSigasPorVencer(porVencer);
      setSigasVencidos(vencidos);
      setSigasEnCampo(enCampo);
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
      } 
      else if (dias >= 1 && dias <= 2) {
        contadorPorVencer++;
      } 
      else if (dias === 0) {
        // Vencen Hoy
      } 
      else { 
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

  async function cargarSigasDashboard() {
    const { data } = await supabase
      .from("sigas")
      .select(`
        *,
        estados_siga(nombre)
      `);
    setSigas(data || []);
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

  const navigate = useNavigate();

  async function buscarGlobal() {

    if (!busquedaGlobal.trim()) {
      setResultadosBusqueda([]);

      return;
    }

    const texto = busquedaGlobal.trim();
    
    const { data: ordenes } =
      await supabase
        .from("ordenes")
        .select(`id,numero_ost,cliente,estado(nombre)`)
        .or(`numero_ost.ilike.%${texto}%,cliente.ilike.%${texto}%,numero_linea.ilike.%${texto}%`);

    const { data: sigas } =
      await supabase
        .from("sigas")
        .select(`id,numero_siga,cliente,estados_siga(nombre)`)
        .or(`numero_siga.ilike.%${texto}%,cliente.ilike.%${texto}%`);

    setResultadosBusqueda([

      ...(ordenes || []).map(
        (o) => ({
          tipo: "ORDEN",
          numero: o.numero_ost,
          cliente: o.cliente,
          estado: o.estado?.nombre,
          id: o.id
        })
      ),

      ...(sigas || []).map(
        (s) => ({
          tipo: "SIGA",
          numero: s.numero_siga,
          cliente: s.cliente,
          estado: s.estados_siga?.nombre,
          id: s.id
        })
      )

    ]);
  }

  useEffect(() => {
    buscarGlobal();
  }, [busquedaGlobal]);

  return (
    <div>
      <h1>Dashboard</h1>

      <p>
        Bienvenido {perfil?.nombre}
      </p>

      <br/>

      <div
        style={{
          marginBottom: "20px"
        }}
      >
        <input
          type="text"
          placeholder="🔍 Buscar OST, SIGA o Cliente..."
          value={busquedaGlobal}
          onChange={(e) =>
            setBusquedaGlobal(
              e.target.value
            )
          }
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            boxSizing: "border-box"
          }}
        />
      </div>

      {
        busquedaGlobal.trim() !== "" && (

          <div>

            <h3>Resultados de busqueda</h3>

            {        
              resultadosBusqueda.length > 0 
                ? resultadosBusqueda.map((item) => (

                  <div
                    key={`${item.tipo}-${item.id}`}
                    style={{
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      padding: "12px",
                      marginBottom: "10px",
                      cursor: "pointer"
                    }}
                  >
                    <strong>
                      {item.tipo === "SIGA"
                        ? "📡 SIGA"
                        : "📄 OST"}
                    </strong>

                    {" "}
                    {item.numero}

                    <div>
                      Cliente: {item.cliente}
                    </div>

                    <div>
                      Estado: {item.estado}
                    </div>

                  </div>
                ))
               : (
                    <p>
                      No se encontraron resultados
                    </p>
                  )
            }
          </div>
        )
      }

      <hr
        style={{
          margin: "40px 0"
        }}
      />

      <h2
        style={{
          textAlign: "center"
        }}
      >
        Órdenes
      </h2>

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

        <div style={{
            ...cardStyle,
            cursor: "pointer"
          }}
          onClick={() =>
            navigate("/ordenes", {
              state: {
                filtroDashboard: "Dentro SLA"
              }
            })
          }
        >
          <h3>Dentro SLA</h3>
          <h1>{dentroSLA}</h1>
        </div>

        <div style={{
            ...cardStyle,
            cursor: "pointer"
          }}
          onClick={() =>
            navigate("/ordenes", {
              state: {
                filtroDashboard: "Por vencer"
              }
            })
          }
        >
          <h3>Por Vencer</h3>
          <h1>{porVencer}</h1>
        </div>

        <div style={{
            ...cardStyle, 
            cursor: "pointer"
          }} 
          onClick={() =>
            navigate("/ordenes", {
              state: {
                filtroDashboard: "Vencen hoy"
              }
            })
          }
        >
          <h3>Vencen Hoy</h3>
          <h1>{vencenHoy}</h1>
        </div>

        <div style={{
            ...cardStyle,
            cursor: "pointer"
          }}
          onClick={() =>
            navigate("/ordenes", {
              state: {
                filtroDashboard: "Vencidas"
              }
            })
          }
        >
          <h3>Vencidas</h3>
          <h1>{vencidas}</h1>
        </div>

        <div style={{
            ...cardStyle,
            cursor: "pointer"
          }}
          onClick={() =>
            navigate("/ordenes", {
              state: {
                filtroDashboard: "Reingresadas"
              }
            })
          }
        >
          <h3>Órdenes Reingresadas</h3>
          <h1>{totalReingresadas}</h1>
        </div>

        <div style={{
            ...cardStyle,
            cursor: "pointer"
          }}
            onClick={() =>
            navigate("/ordenes", {
              state: {
                filtroDashboard: "En Campo"
              }
            })
          }
        >
          <h3>En Campo</h3>
          <h1>{enCampo}</h1>
        </div>
      </div>

      <hr
        style={{
          margin: "40px 0"
        }}
      />

      <h2
        style={{
          textAlign: "center"
        }}
      >
        SIGA
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginTop: "30px",
        }}
      >
        <div style={{
            ...cardStyle,
            cursor: "pointer"
          }}
          onClick={() =>
            navigate("/siga", {
              state: {
                filtroDashboard: "SIGAs Dentro SLA"
              }
            })
          }
        >
          <h3>Dentro SLA</h3>
          <h1>{sigasDentroSLA}</h1>
        </div>

        <div style={{
            ...cardStyle,
            cursor: "pointer"
          }}
          onClick={() =>
            navigate("/siga", {
              state: {
                filtroDashboard: "SIGAs En campo"
              }
            })
          }
        >
          <h3>En Campo</h3>
          <h1>{sigasEnCampo}</h1>
        </div>

        <div style={{
            ...cardStyle,
            cursor: "pointer"
          }}
          onClick={() =>
            navigate("/siga", {
              state: {
                filtroDashboard: "SIGAs Por vencer"
              }
            })
          }
        >
          <h3>Por Vencer</h3>
          <h1>{sigasPorVencer}</h1>
        </div>

        <div
          style={{
            ...cardStyle,
            cursor: "pointer"
          }}
          onClick={() =>
            navigate("/siga", {
              state: {
                filtroDashboard: "Vencidos"
              }
            })
          }
        >
          <h3>Vencidos</h3>

          <h1>{sigasVencidos}</h1>
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