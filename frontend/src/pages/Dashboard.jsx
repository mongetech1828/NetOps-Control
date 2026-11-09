import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  calcularHorasRestantesSIGA,
  cargarMovimientosSIGA
} from "../utils/sigaSla";

function Dashboard({perfil}) {

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
  const [sigasDentroSLA, setSigasDentroSLA] = useState(0);
  const [sigasEnCampo, setSigasEnCampo] = useState(0);
  const [sigasPorVencer, setSigasPorVencer] = useState(0);
  const [sigasVencidos, setSigasVencidos] = useState(0);
  const [busquedaGlobal, setBusquedaGlobal] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);

  useEffect(() => {

    async function cargarKpis() {
      try {
        const response = await fetch("/api/ordenes");
        const ordenes = await response.json();

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        let dentroSLA = 0;
        let porVencer = 0;
        let vencenHoy = 0;
        let vencidas = 0;
        let reingresadas = 0;
        let enCampo = 0;

        ordenes.forEach((orden) => {

          // Reingresadas
          if ((orden.cantidad_reingresos || 0) > 0) {
            reingresadas++;
          }

          // En Campo
          if (
            Number(orden.estado_id) === 7
          ) {
            enCampo++;
          }

          // SLA
          if (orden.fecha_maxima_atencion) {

            const fechaMaxima = new Date(
              orden.fecha_maxima_atencion
            );

            fechaMaxima.setHours(0, 0, 0, 0);

            const diferenciaDias = Math.ceil(
              (fechaMaxima - hoy) /
              (1000 * 60 * 60 * 24)
            );

            if (diferenciaDias > 2) {
              dentroSLA++;
            }
            else if (diferenciaDias >= 1 && diferenciaDias <= 2) {
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

        setTotalOrdenes(ordenes.length);
        setDentroSLA(dentroSLA);
        setPorVencer(porVencer);
        setVencenHoy(vencenHoy);
        setVencidas(vencidas);
        setTotalReingresadas(reingresadas);
        setEnCampo(enCampo);

      } catch (error) {
        console.error("ERROR CARGANDO KPIs:", error);
      }
    }

    cargarKpis();
    cargarSigasDashboard();
    
    /*cargarSLA();*/

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

  // Mostrar Ordenes Vencen Hoy
  async function mostrarOrdenesHoy() {

    try {

      const response =
        await fetch("/api/ordenes");

      if (!response.ok) {
        return;
      }

      const ordenes =
        await response.json();

      const hoy = new Date();

      hoy.setHours(
        0, 0, 0, 0
      );

      const filtradas =
        ordenes.filter(
          orden => {

            if (
              !orden.fecha_maxima_atencion
            ) {
              return false;
            }

            const fecha =
              new Date(
                orden.fecha_maxima_atencion
              );

            fecha.setHours(
              0, 0, 0, 0
            );

            return (
              fecha.getTime() ===
              hoy.getTime()
            );

          }
        );

      setOrdenesVencenHoy(
        filtradas
      );

      setMostrarVencenHoy(
        true
      );

    } catch (error) {

      console.error(error);

    }

  }

  //Mostrar Ordenes reingresadas
  async function mostrarReingresos() {

    try {

      const response =
        await fetch("/api/ordenes");

      if (!response.ok) {
        return;
      }

      const ordenes =
        await response.json();

      const filtradas =
        ordenes.filter(
          orden =>
            (
              orden.cantidad_reingresos || 0
            ) > 0
        );

      setOrdenesReingresadas(
        filtradas
      );

      setMostrarReingresadas(
        true
      );

    } catch (error) {

      console.error(error);

    }

  }

  //Mostrar Ordenes en campo
  async function mostrarOrdenesEnCampo() {

    try {

      const response =
        await fetch("/api/ordenes");

      if (!response.ok) {
        return;
      }

      const ordenes =
        await response.json();

      const filtradas =
        ordenes.filter(
          orden =>
            Number(
              orden.estado_id
            ) === 7
        );

      setOrdenesEnCampo(
        filtradas
      );

      setMostrarEnCampo(
        true
      );

    } catch (error) {

      console.error(error);

    }

  }

  //Mostrar Ordenes Por Vencer
  async function mostrarOrdenesPorVencer() {

    try {

      const response =
        await fetch("/api/ordenes");

      if (!response.ok) {
        return;
      }

      const ordenes =
        await response.json();

      const filtradas =
        ordenes.filter(
          orden => {

            const dias =
              diasRestantes(
                orden.fecha_maxima_atencion
              );

            return (
              dias >= 1 &&
              dias <= 2
            );

          }
        );

      setOrdenesPorVencer(
        filtradas
      );

      setMostrarPorVencer(
        true
      );

    } catch (error) {

      console.error(error);

    }

  }

  //Mostrar Ordenes Vencidas
  async function mostrarOrdenesVencidas() {

    try {

      const response =
        await fetch("/api/ordenes");

      if (!response.ok) {
        return;
      }

      const ordenes =
        await response.json();

      const filtradas =
        ordenes.filter(
          orden =>
            diasRestantes(
              orden.fecha_maxima_atencion
            ) < 0
        );

      setOrdenesVencidas(
        filtradas
      );

      setMostrarVencidas(
        true
      );

    } catch (error) {

      console.error(error);

    }

  }

  function diasRestantes(fechaMaxima) {
    const hoy = new Date();
    const fecha = new Date(fechaMaxima);

    const diffTime = fecha - hoy;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  async function cargarSigasDashboard() {

    try {

      const response =
        await fetch("/api/sigas");

      if (!response.ok) {

        console.error(
          "ERROR CARGANDO SIGAS"
        );

        return;
      }

      const sigas =
        await response.json();

      const {
        data: movimientos,
        error: errorMovimientos
      } = await cargarMovimientosSIGA();

      if (errorMovimientos) {

        console.error(
          "ERROR CARGANDO MOVIMIENTOS SLA:",
          errorMovimientos
        );

        return;
      }

      const movimientosPorSiga =
        new Map();

      movimientos.forEach(
        movimiento => {

          const lista =
            movimientosPorSiga.get(
              Number(movimiento.siga_id)
            ) || [];

          lista.push(
            movimiento
          );

          movimientosPorSiga.set(
            Number(movimiento.siga_id),
            lista
          );

        }
      );

      let dentroSLA = 0;
      let porVencer = 0;
      let vencidos = 0;
      let enCampo = 0;

      sigas.forEach(
        siga => {

          const horasRestantes =
            calcularHorasRestantesSIGA(
              siga.fecha_maxima_atencion,
              movimientosPorSiga.get(
                Number(siga.id)
              ) || [],
              siga.estado
            );

          // En Campo
          if (
            siga.estado !== "Cerrado" &&
            siga.estado !== "Abierto-Verificación" &&
            siga.tecnicos?.length > 0
          ) {
            enCampo++;
          }

          // Diferidos no cuentan
          if (
            siga.estado === "Diferido"
          ) {
            return;
          }

          // Cerrados tampoco
          if (
            siga.estado === "Cerrado"
          ) {
            return;
          }

          if (
            horasRestantes === null ||
            horasRestantes === undefined
          ) {
            return;
          }

          if (
            horasRestantes > 1
          ) {

            dentroSLA++;

          }
          else if (
            horasRestantes > 0 &&
            horasRestantes <= 1
          ) {

            porVencer++;

          }
          else {

            vencidos++;

          }

        }
      );

      setSigasDentroSLA(
        dentroSLA
      );

      setSigasPorVencer(
        porVencer
      );

      setSigasVencidos(
        vencidos
      );

      setSigasEnCampo(
        enCampo
      );

    } catch (error) {

      console.error(
        "ERROR KPI SIGA:",
        error
      );

    }

  }

  const cardStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "14px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    textAlign: "center",
    transition: "all 0.2s ease"
  };

  const navigate = useNavigate();

  async function buscarGlobal() {

    if (!busquedaGlobal.trim().length < 3) {

      setResultadosBusqueda([]);

      return;
    }

    try {

      const texto =
        busquedaGlobal
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

      console.error(
        "ERROR EN BÚSQUEDA GLOBAL:",
        error
      );

    }

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
        style={{
          margin: "40px 0"
        }}
      />

      <h2
        style={{
          textAlign: "center",
          marginBottom: "20px"
        }}
      >
        Órdenes
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginTop: "15px",
        }}
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
        style={{
          margin: "40px 0"
        }}
      />

      <h2
        style={{
          textAlign: "center",
          marginBottom: "20px"
        }}
      >
        SIGA
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginTop: "15px",
        }}
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