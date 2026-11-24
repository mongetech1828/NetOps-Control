import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { calcularMetricasSIGA } from "../utils/sigaSla";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function parsearFecha(fecha) {
  if (!fecha) {
    return null;
  }

  let valor = String(fecha).trim().replace(" ", "T");
  valor = valor.replace(
    /(\.\d{3})\d+(?=Z|[+-]\d{2}(?::?\d{2})?$|$)/i,
    "$1"
  );
  const tieneZonaHoraria =
    valor.includes("T") &&
    /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(valor);
  if (!tieneZonaHoraria) {
    valor = `${valor.includes("T") ? valor : `${valor}T00:00:00`}-06:00`;
  }

  const fechaParseada = new Date(valor);
  return Number.isNaN(fechaParseada.getTime()) ? null : fechaParseada;
}

async function obtenerLista(url, permitirNoEncontrado = false) {
  const respuesta = await fetch(url);
  if (permitirNoEncontrado && respuesta.status === 404) {
    return [];
  }
  if (!respuesta.ok) {
    throw new Error(`No se pudo consultar ${url} (${respuesta.status}).`);
  }

  const datos = await respuesta.json();
  if (!Array.isArray(datos)) {
    throw new Error(`La respuesta de ${url} no tiene un formato válido.`);
  }

  return datos;
}

async function obtenerHistorial(url, permitirNoEncontrado = false) {
  const respuesta = await fetch(url);
  if (permitirNoEncontrado && respuesta.status === 404) {
    return [];
  }
  if (!respuesta.ok) {
    throw new Error(`No se pudo consultar ${url} (${respuesta.status}).`);
  }

  const historial = await respuesta.json();
  if (!Array.isArray(historial)) {
    throw new Error(`El historial de ${url} no tiene un formato válido.`);
  }

  return historial;
}

async function cargarPorLotes(elementos, obtenerDato) {
  const resultados = [];
  for (let indice = 0; indice < elementos.length; indice += 10) {
    const lote = elementos.slice(indice, indice + 10);
    resultados.push(...await Promise.all(lote.map(obtenerDato)));
  }
  return resultados;
}

function obtenerTecnicosAsignados(asignaciones) {
  return [...new Set(asignaciones.map(({ tecnico_id }) => String(tecnico_id)))];
}

function obtenerFechaCierreOrden(orden, historial) {
  if (String(orden.estado || "").toLowerCase() !== "ejecutada") {
    return null;
  }

  const movimientos = historial.filter((movimiento) =>
    (
      String(movimiento.estado_nuevo) === String(orden.estado_id) ||
      String(movimiento.comentario || "").toLowerCase().includes("ejecutada")
    )
  );
  const movimientoCierre = movimientos
    .map((movimiento) => ({
      ...movimiento,
      fecha: parsearFecha(movimiento.fecha_movimiento)
    }))
    .filter(({ fecha }) => fecha)
    .sort((a, b) => b.fecha - a.fecha)[0];

  return movimientoCierre?.fecha || null;
}

function obtenerFechaCierreSIGA(historial) {
  const cierres = historial
    .filter((movimiento) => movimiento.tipo_movimiento === "Cierre")
    .map((movimiento) => ({
      ...movimiento,
      fecha: parsearFecha(movimiento.fecha_movimiento)
    }))
    .filter(({ fecha }) => fecha)
    .sort((a, b) => b.fecha - a.fecha);

  return cierres[0]?.fecha || null;
}

function crearDatosCerrados(registros, historiales, asignaciones, tipo) {
  return registros.flatMap((registro, indice) => {
    const fechaCierre = tipo === "orden"
      ? obtenerFechaCierreOrden(registro, historiales[indice])
      : obtenerFechaCierreSIGA(historiales[indice]);
    const fechaRecepcion = parsearFecha(registro.fecha_recepcion);
    if (!fechaCierre || !fechaRecepcion) {
      return [];
    }

    const duracionMs = tipo === "siga"
      ? calcularMetricasSIGA(
        historiales[indice],
        Number(registro.horas_sla) || 0,
        fechaRecepcion
      ).tiempoConsumidoHoras * 3600000
      : fechaCierre - fechaRecepcion;

    return [{
      fechaCierre,
      duracionMs: Math.max(0, duracionMs),
      tecnicos: obtenerTecnicosAsignados(asignaciones[indice])
    }];
  });
}

function obtenerInicioPeriodo(periodo) {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);

  if (periodo === "7dias") {
    inicio.setDate(inicio.getDate() - 6);
  } else if (periodo === "mes") {
    inicio.setDate(1);
  } else if (periodo === "30dias") {
    inicio.setDate(inicio.getDate() - 29);
  } else if (periodo === "anio") {
    inicio.setMonth(0, 1);
  }

  return inicio;
}

function formatearTiempoOrden(dias) {
  return `${dias.toFixed(1)} días`;
}

function formatearTiempoSIGA(horas) {
  const minutosTotales = Math.round(horas * 60);
  return `${Math.floor(minutosTotales / 60)}h ${minutosTotales % 60}m`;
}

function formatearNombreTecnico(nombreCompleto) {
  const [nombre, ...apellidos] = nombreCompleto.trim().split(/\s+/);
  return apellidos.length
    ? `${nombre.charAt(0)}. ${apellidos.join(" ")}`
    : nombre;
}

function Reportes() {

  const [periodo, setPeriodo] = useState("mes");
  const [tecnicoFiltro, setTecnicoFiltro] = useState("todos");
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState("");
  const [datosTecnicos, setDatosTecnicos] = useState([]);
  const [ordenesCerradas, setOrdenesCerradas] = useState([]);
  const [sigasCerrados, setSigasCerrados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarReportes() {
      try {
        const [ordenes, sigas, tecnicos] = await Promise.all([
          obtenerLista("/api/ordenes"),
          obtenerLista("/api/sigas"),
          obtenerLista("/api/tecnicos")
        ]);
        const [historialesOrdenes, historialesSigas] = await Promise.all([
          cargarPorLotes(ordenes, (orden) =>
            obtenerHistorial(`/api/historial-orden/${orden.id}`)
          ),
          cargarPorLotes(sigas, (siga) =>
            obtenerHistorial(`/api/historial-siga/${siga.id}`, true)
          )
        ]);
        const indicesOrdenesCerradas = ordenes
          .map((orden, indice) => obtenerFechaCierreOrden(orden, historialesOrdenes[indice]) ? indice : -1)
          .filter((indice) => indice >= 0);
        const indicesSigasCerrados = sigas
          .map((siga, indice) => obtenerFechaCierreSIGA(historialesSigas[indice]) ? indice : -1)
          .filter((indice) => indice >= 0);
        const [asignacionesOrdenes, asignacionesSigas] = await Promise.all([
          cargarPorLotes(indicesOrdenesCerradas, (indice) =>
            obtenerLista(`/api/orden-tecnicos/${ordenes[indice].id}`, true)
          ),
          cargarPorLotes(indicesSigasCerrados, (indice) =>
            obtenerLista(`/api/siga-tecnicos/${sigas[indice].id}`, true)
          )
        ]);
        const cierresOrdenesPorIndice = new Map(
          indicesOrdenesCerradas.map((indice, posicion) => [indice, asignacionesOrdenes[posicion]])
        );
        const cierresSigasPorIndice = new Map(
          indicesSigasCerrados.map((indice, posicion) => [indice, asignacionesSigas[posicion]])
        );
        const ordenesFinales = ordenes.flatMap((orden, indice) => {
          const cierre = crearDatosCerrados(
            [orden],
            [historialesOrdenes[indice]],
            [cierresOrdenesPorIndice.get(indice) || []],
            "orden"
          );
          return cierre;
        });
        const sigasFinales = sigas.flatMap((siga, indice) =>
          crearDatosCerrados(
            [siga],
            [historialesSigas[indice]],
            [cierresSigasPorIndice.get(indice) || []],
            "siga"
          )
        );

        if (activo) {
          setDatosTecnicos(tecnicos);
          setOrdenesCerradas(ordenesFinales);
          setSigasCerrados(sigasFinales);
          setTecnicoSeleccionado(tecnicos.length ? String(tecnicos[0].id) : "");
        }
      } catch (errorCarga) {
        console.error("Error cargando datos de reportes:", errorCarga);
        if (activo) {
          setError("No se pudieron cargar los datos de reportes. Intente recargar la página.");
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarReportes();
    return () => {
      activo = false;
    };
  }, []);

  const resumen = useMemo(() => {
    const inicio = obtenerInicioPeriodo(periodo);
    const ahora = new Date();
    const filtroPorTecnico = (registro) =>
      tecnicoFiltro === "todos" || registro.tecnicos.includes(tecnicoFiltro);
    const dentroPeriodo = (registro) =>
      registro.fechaCierre >= inicio && registro.fechaCierre <= ahora;
    const ordenesFiltradas = ordenesCerradas.filter(
      (registro) => dentroPeriodo(registro) && filtroPorTecnico(registro)
    );
    const sigasFiltrados = sigasCerrados.filter(
      (registro) => dentroPeriodo(registro) && filtroPorTecnico(registro)
    );
    const crearSerieMensual = (registros, tipo) => {
      const meses = [];
      const fecha = new Date();
      fecha.setDate(1);
      fecha.setHours(0, 0, 0, 0);
      fecha.setMonth(fecha.getMonth() - 4);

      for (let indice = 0; indice < 5; indice += 1) {
        const registrosMes = registros.filter((registro) =>
          registro.fechaCierre.getFullYear() === fecha.getFullYear() &&
          registro.fechaCierre.getMonth() === fecha.getMonth()
        );
        const registroMesEnPeriodo = registrosMes.filter(
          (registro) => dentroPeriodo(registro) && filtroPorTecnico(registro)
        );
        const promedio = registroMesEnPeriodo.length
          ? registroMesEnPeriodo.reduce((total, registro) => total + registro.duracionMs, 0) /
            registroMesEnPeriodo.length
          : 0;
        meses.push({
          mes: MESES[fecha.getMonth()],
          cantidad: registroMesEnPeriodo.length,
          [tipo === "orden" ? "dias" : "horas"]: promedio /
            (tipo === "orden" ? 86400000 : 3600000)
        });
        fecha.setMonth(fecha.getMonth() + 1);
      }

      return meses;
    };
    const tecnicosResumen = datosTecnicos.map((tecnico) => {
      const id = String(tecnico.id);
      const ordenesTecnico = ordenesFiltradas.filter((registro) => registro.tecnicos.includes(id));
      const sigasTecnico = sigasFiltrados.filter((registro) => registro.tecnicos.includes(id));
      const promedioOrdenes = ordenesTecnico.length
        ? ordenesTecnico.reduce((total, registro) => total + registro.duracionMs, 0) /
          ordenesTecnico.length / 86400000
        : 0;
      const promedioSigas = sigasTecnico.length
        ? sigasTecnico.reduce((total, registro) => total + registro.duracionMs, 0) /
          sigasTecnico.length / 3600000
        : 0;

      return {
        id,
        nombre: tecnico.nombre,
        ordenes: ordenesTecnico.length,
        sigas: sigasTecnico.length,
        total: ordenesTecnico.length + sigasTecnico.length,
        tiempoOrdenes: formatearTiempoOrden(promedioOrdenes),
        tiempoSigas: formatearTiempoSIGA(promedioSigas)
      };
    });
    const tecnicoActivo =
      tecnicosResumen.find((tecnico) => tecnico.id === tecnicoSeleccionado) ||
      tecnicosResumen[0] || {
        id: "",
        nombre: "Sin datos",
        ordenes: 0,
        sigas: 0,
        total: 0,
        tiempoOrdenes: "0.0 días",
        tiempoSigas: "0h 0m"
      };
    const ordenarParaGrafico = (registros) =>
      registros.filter((registro) => dentroPeriodo(registro) && filtroPorTecnico(registro));

    return {
      ordenes: ordenarParaGrafico(ordenesCerradas),
      sigas: ordenarParaGrafico(sigasCerrados),
      ordenesMes: crearSerieMensual(ordenesCerradas, "orden"),
      sigasMes: crearSerieMensual(sigasCerrados, "siga"),
      tiempoOrdenes: crearSerieMensual(ordenesCerradas, "orden"),
      tiempoSigas: crearSerieMensual(sigasCerrados, "siga"),
      tecnicos: tecnicosResumen,
      tecnico: tecnicoActivo
    };
  }, [datosTecnicos, ordenesCerradas, periodo, sigasCerrados, tecnicoFiltro, tecnicoSeleccionado]);

  const productividadTecnicos = resumen.tecnicos.map((tecnico) => ({
    tecnico: formatearNombreTecnico(tecnico.nombre),
    ordenes: tecnico.ordenes,
    sigas: tecnico.sigas
  }));
  const tiempoPromedioOrdenes = resumen.ordenes.length
    ? resumen.ordenes.reduce((total, registro) => total + registro.duracionMs, 0) /
      resumen.ordenes.length / 86400000
    : 0;
  const tiempoPromedioSigas = resumen.sigas.length
    ? resumen.sigas.reduce((total, registro) => total + registro.duracionMs, 0) /
      resumen.sigas.length / 3600000
    : 0;
  const tecnico = resumen.tecnico;

  const cardStyle = {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    transition: "all 0.2s ease"
  };

  return (
    <div>

      <h1>Reportes</h1>

      <p>
        Indicadores de productividad y desempeño operativo.
      </p>

      <br />

      <div
        style={{
          display: "flex",
          gap: "15px",
          marginBottom: "30px"
        }}
      >
        <select
          value={periodo}
          onChange={(e) =>
            setPeriodo(e.target.value)
          }
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #d1d5db"
          }}
        >
          <option value="hoy">Hoy</option>
          <option value="7dias">Últimos 7 días</option>
          <option value="mes">Mes Actual</option>
          <option value="30dias">Últimos 30 días</option>
          <option value="anio">Este Año</option>
        </select>

        <select
          value={tecnicoFiltro}
          onChange={(e) =>
            setTecnicoFiltro(e.target.value)
          }
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #d1d5db"
          }}
        >
          <option value="todos">
            Todos los Técnicos
          </option>
          {datosTecnicos.map((item) => (
            <option key={item.id} value={String(item.id)}>
              {item.nombre}
            </option>
          ))}
        </select>
      </div>

      {cargando && <p role="status">Cargando datos de reportes...</p>}
      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}

      {/* KPI */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginBottom: "30px"
        }}
      >

        <div
          style={{
            ...cardStyle,
            borderLeft: "5px solid #2563eb"
          }}
        >
          <h3>Órdenes Ejecutadas</h3>
          <h1>{resumen.ordenes.length}</h1>
        </div>

        <div
          style={{
            ...cardStyle,
            borderLeft: "5px solid #22c55e"
          }}
        >
          <h3>Tiempo Promedio Órdenes</h3>
          <h1>{formatearTiempoOrden(tiempoPromedioOrdenes)}</h1>
        </div>

        <div
          style={{
            ...cardStyle,
            borderLeft: "5px solid #8b5cf6"
          }}
        >
          <h3>SIGAs Cerrados</h3>
          <h1>{resumen.sigas.length}</h1>
        </div>

        <div
          style={{
            ...cardStyle,
            borderLeft: "5px solid #f59e0b"
          }}
        >
          <h3>Tiempo Promedio SIGAs</h3>
          <h1>{formatearTiempoSIGA(tiempoPromedioSigas)}</h1>
        </div>

      </div>

      {/* GRAFICOS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "30px"
        }}
      >
        <div className="bg-white rounded-xl shadow p-6 h-80">
          <h3 className="text-xl font-semibold text-center mb-4">
            Órdenes Ejecutadas por Mes
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={resumen.ordenesMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="cantidad"
                fill="#2563eb"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow p-6 h-80">
          <h3 className="text-xl font-semibold text-center mb-4">
            SIGAs Cerrados por Mes
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={resumen.sigasMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="cantidad"
                fill="#2563eb"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* TENDENCIAS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "30px"
        }}
      >
        <div className="bg-white rounded-xl shadow p-6 h-80">
          <h3 className="text-xl font-semibold text-center mb-4">
            Tendencia Tiempo Órdenes
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={resumen.tiempoOrdenes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="dias"
                stroke="#22c55e"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow p-6 h-80">
          <h3 className="text-xl font-semibold text-center mb-4">
            Tendencia Tiempo SIGAs
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={resumen.tiempoSigas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="horas"
                stroke="#f59e0b"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* PRODUCTIVIDAD */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "30px",
          alignItems: "start",
        }}
      >

        {/* GRAFICO */}
        <div className="bg-white rounded-xl shadow p-6">
          
          <h3 className="text-xl font-semibold text-center">
            Productividad Total por Técnico
          </h3>

          <p
            style={{
              textAlign: "center",
              color: "#6b7280",
              marginBottom: "15px",
            }}
          >
            Comparativo de órdenes ejecutadas y SIGAs cerrados por técnico
          </p>

          <div
            style={{
              height: 350,
              overflowY: productividadTecnicos.length > 5 ? "auto" : "hidden",
              overflowX: "hidden"
            }}
          >
            <ResponsiveContainer
              width="100%"
              height={Math.max(350, productividadTecnicos.length * 65)}
            >
              <BarChart
                layout="vertical"
                data={productividadTecnicos}
              >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis type="number" />

              <YAxis
                type="category"
                dataKey="tecnico"
                width={100}
              />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="ordenes"
                name="Órdenes"
                fill="#2563eb"
                radius={[0, 6, 6, 0]}
              />

              <Bar
                dataKey="sigas"
                name="SIGAs"
                fill="#f59e0b"
                stroke="#92400e"
                strokeWidth={1}
                radius={[0, 6, 6, 0]}
              />

              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* RESUMEN TECNICO */}
        <div className="bg-white rounded-xl shadow p-6">

          <h3 className="text-xl font-semibold mb-4">
            Desempeño del Técnico
          </h3>

          <div
            style={{
              maxWidth: "500px",
              margin: "0 auto",
              border: "1px solid #d1d5db",
              borderRadius: "12px",
              padding: "20px",
              backgroundColor: "#f9fafb",
            }}
          >

            <select
              value={tecnicoSeleccionado}
              onChange={(e) =>
                setTecnicoSeleccionado(e.target.value)
              }
              style={{
                marginBottom: "20px",
                padding: "6px",
              }}
            >
              {resumen.tecnicos.map((t) => (
                <option
                  key={t.id}
                  value={t.id}
                >
                  {t.nombre}
                </option>
              ))}
            </select>

            <div
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "12px",
                padding: "20px",
                backgroundColor: "#f9fafb",
              }}
            >

              <div
                style={{
                  textAlign: "center",
                  marginBottom: "20px",
                  fontSize: "22px",
                  fontWeight: "bold",
                }}
              >
                👤 {tecnico.nombre}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginBottom: "15px",
                }}
              >

                <div
                  style={{
                    backgroundColor: "#dbeafe",
                    borderRadius: "10px",
                    padding: "15px",
                    textAlign: "center",
                  }}
                >
                  <div>Órdenes</div>

                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: "bold",
                      backgroundColor: "#dbeafe",
                      color: "#2563eb",
                    }}
                  >
                    {tecnico.ordenes}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "#ede9fe",
                    borderRadius: "10px",
                    padding: "15px",
                    textAlign: "center",
                  }}
                >
                  <div>SIGAs</div>

                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: "bold",
                      backgroundColor: "#dbeafe",
                      color: "#ea580c",
                    }}
                  >
                    {tecnico.sigas}
                  </div>
                </div>

              </div>

              <div
                style={{
                  backgroundColor: "#dcfce7",
                  borderRadius: "10px",
                  padding: "15px",
                  textAlign: "center",
                  marginBottom: "15px",
                }}
              >
                <div>Total Gestionado</div>

                <div
                  style={{
                    fontSize: "34px",
                    fontWeight: "bold",
                    color: "#15803d",
                  }}
                >
                  {tecnico.total}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  padding: "15px",
                  marginBottom: "10px",
                  backgroundColor: "white",
                }}
              >
                <div
                  style={{
                    color: "#6b7280",
                    marginBottom: "5px",
                  }}
                >
                  ⏱ Tiempo Promedio Órdenes
                </div>

                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: "bold",
                  }}
                >
                  {tecnico.tiempoOrdenes}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  padding: "15px",
                  backgroundColor: "white",
                }}
              >
                <div
                  style={{
                    color: "#6b7280",
                    marginBottom: "5px",
                  }}
                >
                  ⚡ Tiempo Promedio SIGAs
                </div>

                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: "bold",
                  }}
                >
                  {tecnico.tiempoSigas}
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Reportes;