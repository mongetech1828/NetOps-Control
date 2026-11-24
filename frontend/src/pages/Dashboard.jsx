import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  calcularDatosSLAActualSIGA,
  clasificarSLAActualSIGA,
  cargarMovimientosSIGA
} from "../utils/sigaSla";

async function cargarSigasDashboard(onKpisLoaded) {
  try {
    const [response, responsePrioridades] = await Promise.all([
      fetch("/api/sigas"),
      fetch("/api/prioridades-siga")
    ]);

    if (!response.ok || !responsePrioridades.ok) {
      throw new Error("No se pudieron cargar los SIGAs o las prioridades.");
    }

    const [sigas, prioridades] = await Promise.all([
      response.json(),
      responsePrioridades.json()
    ]);
    const { data: movimientos, error: errorMovimientos } =
      await cargarMovimientosSIGA();

    if (errorMovimientos) {
      throw new Error("No se pudieron cargar los movimientos de los SIGAs.");
    }

    const movimientosPorSiga = new Map();
    movimientos.forEach((movimiento) => {
      const lista = movimientosPorSiga.get(Number(movimiento.siga_id)) || [];
      lista.push(movimiento);
      movimientosPorSiga.set(Number(movimiento.siga_id), lista);
    });

    let dentroSLA = 0;
    let porVencer = 0;
    let vencidos = 0;
    let enCampo = 0;
    const ahora = new Date();

    sigas.forEach((siga) => {
      const prioridad = prioridades.find(
        (item) => Number(item.id) === Number(siga.prioridad_id)
      );
      const { horasRestantes, cumpleSLA } = calcularDatosSLAActualSIGA(
        siga,
        movimientosPorSiga.get(Number(siga.id)) || [],
        prioridad?.horas_sla,
        ahora
      );
      const categoriaSLA = clasificarSLAActualSIGA(
        siga,
        horasRestantes,
        cumpleSLA
      );

      if (
        siga.estado !== "Cerrado" &&
        siga.estado !== "Abierto-Verificación" &&
        siga.estado !== "Diferido" &&
        siga.tecnicos?.length > 0
      ) {
        enCampo += 1;
      }

      if (categoriaSLA === "dentro-sla") {
        dentroSLA += 1;
      } else if (categoriaSLA === "por-vencer") {
        porVencer += 1;
      } else if (categoriaSLA === "vencido") {
        vencidos += 1;
      }
    });

    onKpisLoaded({ dentroSLA, porVencer, vencidos, enCampo });
  } catch (error) {
    console.error("ERROR KPI SIGA:", error);
  }
}

function Dashboard({perfil}) {

  const [totalOrdenes, setTotalOrdenes] = useState(0);
  const [dentroSLA, setDentroSLA] = useState(0);
  const [porVencer, setPorVencer] = useState(0);
  const [vencidas, setVencidas] = useState(0);
  const [totalReingresadas, setTotalReingresadas] = useState (0);
  const [vencenHoy, setVencenHoy] = useState(0);
  const [enCampo, setEnCampo] = useState(0);
  const [sigasDentroSLA, setSigasDentroSLA] = useState(0);
  const [sigasEnCampo, setSigasEnCampo] = useState(0);
  const [sigasPorVencer, setSigasPorVencer] = useState(0);
  const [sigasVencidos, setSigasVencidos] = useState(0);
  const [busquedaGlobal, setBusquedaGlobal] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const solicitudBusqueda = useRef(0);

  useEffect(() => {

    async function cargarKpis() {
      try {

        const response = await fetch("/api/ordenes");
        const ordenes = await response.json();

        // Solo órdenes activas para el Dashboard
        const ordenesActivas = ordenes.filter(
          orden =>
            orden.estado !== "Ejecutada" &&
            orden.estado !== "Devuelta"
        );

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        let dentroSLA = 0;
        let porVencer = 0;
        let vencenHoy = 0;
        let vencidas = 0;
        let reingresadas = 0;
        let enCampo = 0;

        ordenesActivas.forEach((orden) => {

          // Reingresadas
          if ((orden.cantidad_reingresos || 0) > 0) {
            reingresadas++;
          }

          // En Campo
          if (Number(orden.estado_id) === 7) {
            enCampo++;
          }

          // Fecha objetivo:
          // Si existe compromiso cliente se usa.
          // Si no existe se usa la fecha máxima SLA.

          const fechaObjetivo =
            orden.fecha_compromiso_cliente ||
            orden.fecha_maxima_atencion;

          if (fechaObjetivo) {

            const fecha = new Date(fechaObjetivo);

            fecha.setHours(0, 0, 0, 0);

            const diferenciaDias = Math.ceil(
              (fecha - hoy) /
              (1000 * 60 * 60 * 24)
            );

            if (diferenciaDias > 2) {
              dentroSLA++;
            }
            else if (
              diferenciaDias >= 1 &&
              diferenciaDias <= 2
            ) {
              porVencer++;
            }
            else if (diferenciaDias === 0) {
              vencenHoy++;
            }
            else {
              vencidas++;
            }

          }

        });

        setTotalOrdenes(ordenesActivas.length);
        setDentroSLA(dentroSLA);
        setPorVencer(porVencer);
        setVencenHoy(vencenHoy);
        setVencidas(vencidas);
        setTotalReingresadas(reingresadas);
        setEnCampo(enCampo);

      }
      catch (error) {
        console.error(
          "ERROR CARGANDO KPIs:",
          error
        );
      }
    }

    cargarKpis();
    cargarSigasDashboard(({ dentroSLA, porVencer, vencidos, enCampo }) => {
      setSigasDentroSLA(dentroSLA);
      setSigasPorVencer(porVencer);
      setSigasVencidos(vencidos);
      setSigasEnCampo(enCampo);
    });

  }, []);

  const cardStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    border: "1px solid #dbe4f0",
    padding: "18px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.1)",
    textAlign: "center",
    transition: "all 0.2s ease"
  };

  const navigate = useNavigate();

  async function buscarGlobal(busqueda) {
    const solicitud = ++solicitudBusqueda.current;

    if (busqueda.trim().length < 3) {

      setResultadosBusqueda([]);

      return;
    }

    try {

      const texto =
        busqueda
          .trim()
          .toLowerCase();

      const [
        responseOrdenes,
        responseSigas
      ] = await Promise.all([
        fetch("/api/ordenes"),
        fetch("/api/sigas")
      ]);

      if (
        !responseOrdenes.ok ||
        !responseSigas.ok
      ) {

        console.error(
          "ERROR BUSCANDO INFORMACIÓN"
        );

        return;
      }

      const ordenes =
        await responseOrdenes.json();

      const sigas =
        await responseSigas.json();

      const ordenesFiltradas =
        ordenes.filter(
          orden =>
            (
              orden.numero_ost || ""
            )
              .toLowerCase()
              .includes(texto)
            ||
            (
              orden.cliente || ""
            )
              .toLowerCase()
              .includes(texto)
            ||
            (
              orden.numero_linea || ""
            )
              .toLowerCase()
              .includes(texto)
        );

      const sigasFiltradas =
        sigas.filter(
          siga =>
            (
              siga.numero_siga || ""
            )
              .toLowerCase()
              .includes(texto)
            ||
            (
              siga.cliente || ""
            )
              .toLowerCase()
              .includes(texto)
            ||
            (
              siga.numero_linea || ""
            )
              .toLowerCase()
              .includes(texto)
        );

      if (solicitud !== solicitudBusqueda.current) {
        return;
      }

      setResultadosBusqueda([
        ...ordenesFiltradas.map(
          orden => ({
            tipo: "ORDEN",
            numero:
              orden.numero_ost,
            cliente:
              orden.cliente,
            linea:
              orden.numero_linea,
            estado:
              orden.estado,
            id:
              orden.id
          })
        ),

        ...sigasFiltradas.map(
          siga => ({
            tipo: "SIGA",
            numero:
              siga.numero_siga,
            cliente:
              siga.cliente,
            linea:
              siga.numero_linea,
            estado:
              siga.estado,
            id:
              siga.id
          })
        )

      ]);

    } catch (error) {

      if (solicitud === solicitudBusqueda.current) {
        console.error(
          "ERROR EN BÚSQUEDA GLOBAL:",
          error
        );
      }

    }

  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Bienvenido {perfil?.nombre}
          </h1>
        </div>
      </header>

      <div
        className="dashboard-search"
      >
        <input
          className="dashboard-search-input"
          type="text"
          placeholder="🔍 Buscar OST, SIGA, línea o cliente..."
          value={busquedaGlobal}
          onChange={(e) => {
            const busqueda = e.target.value;
            setBusquedaGlobal(busqueda);
            buscarGlobal(busqueda);
          }}
        />
      </div>

      {
        busquedaGlobal.trim() !== "" && (

          <div className="dashboard-search-results">

            <h3>Resultados de búsqueda</h3>

            {        
              resultadosBusqueda.length > 0 
                ? resultadosBusqueda.map((item) => (

                  <div
                    key={`${item.tipo}-${item.id}`}
                    className="dashboard-search-result"
                  >
                    <strong>
                      {item.tipo === "SIGA"
                        ? "📡 SIGA"
                        : "📄 OST"}
                    </strong>

                    {" "}
                    {item.numero} - {item.linea}

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
        className="dashboard-divider"
        style={{
          margin: "40px 0"
        }}
      />

      <h2
        className="dashboard-section-title"
        style={{
          textAlign: "center",
          marginBottom: "20px"
        }}
      >
        Órdenes
      </h2>

      <div
        className="dashboard-kpi-grid"
      >
        <div style={{
          ...cardStyle,
          borderLeft: "5px solid #2563eb",
          cursor: "pointer"}}

          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.12)";
          }}

          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1rem",
              color: "#64748b"
            }}
          >
            OST Registradas
          </h3>
          <h1
            style={{
              fontSize: "2.5rem",
              margin: "10px 0 0"
            }}
          >{totalOrdenes}</h1>
        </div>

        <div style={{
            ...cardStyle,
            borderLeft: "5px solid #22c55e",
            cursor: "pointer"
          }}

          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.12)";
          }}

          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          }}

          onClick={() =>
            navigate("/ordenes", {
              state: {
                filtroDashboard: "Dentro SLA"
              }
            })
          }
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1rem",
              color: "#64748b"
            }}
          >
            En cumplimiento
          </h3>
          <h1
            style={{
              fontSize: "2.5rem",
              margin: "10px 0 0"
            }}
          >
            {dentroSLA}
          </h1>
        </div>

        <div style={{
            ...cardStyle,
            borderLeft: "5px solid #f59e0b",
            cursor: "pointer"
          }}

          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.12)";
          }}

          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          }}

          onClick={() =>
            navigate("/ordenes", {
              state: {
                filtroDashboard: "Por vencer"
              }
            })
          }
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1rem",
              color: "#64748b"
            }}
          >Por Vencer</h3>
          <h1
            style={{
              fontSize: "2.5rem",
              margin: "10px 0 0"
            }}
          >{porVencer}</h1>
        </div>

        <div style={{
            ...cardStyle, 
            borderLeft: "5px solid #ef4444",
            cursor: "pointer"
          }} 

          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.12)";
          }}

          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          }}

          onClick={() =>
            navigate("/ordenes", {
              state: {
                filtroDashboard: "Vencen hoy"
              }
            })
          }
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1rem",
              color: "#64748b"
            }}
          >Vencen Hoy</h3>
          <h1
            style={{
              fontSize: "2.5rem",
              margin: "10px 0 0"
            }}
          >{vencenHoy}</h1>
        </div>

        <div style={{
            ...cardStyle,
            borderLeft: "5px solid #991b1b",
            cursor: "pointer"
          }}

          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.12)";
          }}

          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          }}

          onClick={() =>
            navigate("/ordenes", {
              state: {
                filtroDashboard: "Vencidas"
              }
            })
          }
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1rem",
              color: "#64748b"
            }}
          >Vencidas</h3>
          <h1
            style={{
              fontSize: "2.5rem",
              margin: "10px 0 0"
            }}
          >{vencidas}</h1>
        </div>

        <div style={{
            ...cardStyle,
            borderLeft: "5px solid #8b5cf6",
            cursor: "pointer"
          }}

          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.12)";
          }}

          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          }}
        
          onClick={() =>
            navigate("/ordenes", {
              state: {
                filtroDashboard: "Reingresadas"
              }
            })
          }
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1rem",
              color: "#64748b"
            }}
          >Órdenes Reingresadas</h3>
          <h1
            style={{
              fontSize: "2.5rem",
              margin: "10px 0 0"
            }}
          >{totalReingresadas}</h1>
        </div>

        <div style={{
            ...cardStyle,
            borderLeft: "5px solid #06b6d4",
            cursor: "pointer"
          }}

          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.12)";
          }}

          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          }}

            onClick={() =>
            navigate("/ordenes", {
              state: {
                filtroDashboard: "En Campo"
              }
            })
          }
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1rem",
              color: "#64748b"
            }}
          >En Campo</h3>
          <h1
            style={{
              fontSize: "2.5rem",
              margin: "10px 0 0"
            }}
          >{enCampo}</h1>
        </div>
      </div>

      <hr
        className="dashboard-divider"
        style={{
          margin: "40px 0"
        }}
      />

      <h2
        className="dashboard-section-title"
        style={{
          textAlign: "center",
          marginBottom: "20px"
        }}
      >
        SIGA
      </h2>

      <div
        className="dashboard-kpi-grid"
      >
        <div style={{
            ...cardStyle,
            borderLeft: "5px solid #22c55e",
            cursor: "pointer"
          }}

          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.12)";
          }}

          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          }}

          onClick={() =>
            navigate("/siga", {
              state: {
                filtroDashboard: "SIGAs Dentro SLA"
              }
            })
          }
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1rem",
              color: "#64748b"
            }}
          >En tiempo</h3>
          <h1
            style={{
              fontSize: "2.5rem",
              margin: "10px 0 0"
            }}
          >{sigasDentroSLA}</h1>
        </div>

        <div style={{
            ...cardStyle,
            borderLeft: "5px solid #06b6d4",
            cursor: "pointer"
          }}

          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.12)";
          }}

          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          }}

          onClick={() =>
            navigate("/siga", {
              state: {
                filtroDashboard: "SIGAs En campo"
              }
            })
          }
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1rem",
              color: "#64748b"
            }}
          >En Campo</h3>
          <h1
            style={{
              fontSize: "2.5rem",
              margin: "10px 0 0"
            }}
          >{sigasEnCampo}</h1>
        </div>

        <div style={{
            ...cardStyle,
            borderLeft: "5px solid #f59e0b",
            cursor: "pointer"
          }}

          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.12)";
          }}

          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          }}

          onClick={() =>
            navigate("/siga", {
              state: {
                filtroDashboard: "SIGAs Por vencer"
              }
            })
          }
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1rem",
              color: "#64748b"
            }}
          >Por Vencer</h3>
          <h1
            style={{
              fontSize: "2.5rem",
              margin: "10px 0 0"
            }}
          >{sigasPorVencer}</h1>
        </div>

        <div
          style={{
            ...cardStyle,
            borderLeft: "5px solid #991b1b",
            cursor: "pointer"
          }}

          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.12)";
          }}

          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          }}
          
          onClick={() =>
            navigate("/siga", {
              state: {
                filtroDashboard: "Vencidos"
              }
            })
          }
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1rem",
              color: "#64748b"
            }}
          >Vencidos</h3>
          <h1
            style={{
              fontSize: "2.5rem",
              margin: "10px 0 0"
            }}
          >{sigasVencidos}</h1>
        </div>
      </div>

    </div>

  );
}

export default Dashboard;