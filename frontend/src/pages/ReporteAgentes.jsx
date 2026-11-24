import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

const ZONA_HORARIA = "America/Costa_Rica";

function parsearFechaMovimiento(fecha) {
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
    // Los timestamps sin zona del historial se interpretan como hora local de Costa Rica.
    valor = `${valor.includes("T") ? valor : `${valor}T00:00:00`}-06:00`;
  }

  const fechaParseada = new Date(valor);
  return Number.isNaN(fechaParseada.getTime()) ? null : fechaParseada;
}

function obtenerFechaCostaRica(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(fecha);
  const valores = Object.fromEntries(
    partes.map(({ type, value }) => [type, value])
  );

  return `${valores.year}-${valores.month}-${valores.day}`;
}

function sumarDias(fecha, dias) {
  const fechaUTC = new Date(`${fecha}T00:00:00Z`);
  fechaUTC.setUTCDate(fechaUTC.getUTCDate() + dias);
  return fechaUTC.toISOString().slice(0, 10);
}

function crearLimitesPeriodo(periodo, fechaInicio, fechaFin) {
  const hoy = obtenerFechaCostaRica();
  let inicio = hoy;

  switch (periodo) {
    case "ultimos-7-dias":
      inicio = sumarDias(hoy, -6);
      break;
    case "mes-actual":
      inicio = `${hoy.slice(0, 7)}-01`;
      break;
    case "ultimos-30-dias":
      inicio = sumarDias(hoy, -29);
      break;
    case "ultimo-ano": {
      const fechaAnual = new Date(`${hoy}T00:00:00Z`);
      fechaAnual.setUTCFullYear(fechaAnual.getUTCFullYear() - 1);
      inicio = fechaAnual.toISOString().slice(0, 10);
      break;
    }
    case "rango":
      inicio = fechaInicio;
      break;
    default:
      break;
  }

  const fin = periodo === "rango" ? fechaFin : hoy;
  return {
    desde: new Date(`${inicio}T00:00:00-06:00`),
    hasta: new Date(`${sumarDias(fin, 1)}T00:00:00-06:00`)
  };
}

function formatearFechaHora(fecha) {
  const fechaParseada = parsearFechaMovimiento(fecha);
  if (!fechaParseada) {
    return "-";
  }

  return fechaParseada.toLocaleString("es-CR", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}

async function obtenerJSON(url) {
  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error(`No se pudo consultar ${url} (${respuesta.status}).`);
  }

  return respuesta.json();
}

async function cargarHistorialesOrdenes(ordenes) {
  const historiales = [];

  for (let indice = 0; indice < ordenes.length; indice += 10) {
    const grupo = ordenes.slice(indice, indice + 10);
    const resultados = await Promise.all(
      grupo.map(async (orden) => {
        const historial = await obtenerJSON(
          `/api/historial-orden/${orden.id}`
        );
        if (!Array.isArray(historial)) {
          throw new Error(
            `El historial de la orden ${orden.numero_ost || orden.id} no tiene un formato válido.`
          );
        }

        return historial;
      })
    );
    historiales.push(...resultados.flat());
  }

  return historiales;
}

async function cargarHistorialesSIGAs(sigas) {
  const historiales = [];

  for (let indice = 0; indice < sigas.length; indice += 10) {
    const grupo = sigas.slice(indice, indice + 10);
    const resultados = await Promise.all(
      grupo.map(async (siga) => {
        const url = `/api/historial-siga/${siga.id}`;
        const respuesta = await fetch(url);
        if (respuesta.status === 404) {
          return [];
        }
        if (!respuesta.ok) {
          throw new Error(`No se pudo consultar ${url} (${respuesta.status}).`);
        }

        const historial = await respuesta.json();
        if (!Array.isArray(historial)) {
          throw new Error(
            `El historial del SIGA ${siga.numero_siga || siga.id} no tiene un formato válido.`
          );
        }

        return historial;
      })
    );
    historiales.push(...resultados.flat());
  }

  return historiales;
}

function ReporteAgentes() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioId, setUsuarioId] = useState("");
  const [periodo, setPeriodo] = useState("hoy");
  const [fechaInicio, setFechaInicio] = useState(obtenerFechaCostaRica);
  const [fechaFin, setFechaFin] = useState(obtenerFechaCostaRica);
  const [reporte, setReporte] = useState(null);
  const [tablaActiva, setTablaActiva] = useState("ordenes");
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarUsuarios() {
      try {
        const perfiles = await obtenerJSON("/api/perfiles");
        if (!Array.isArray(perfiles)) {
          throw new Error("La lista de usuarios no tiene un formato válido.");
        }
        setUsuarios(perfiles);
      } catch (errorCarga) {
        console.error("Error cargando usuarios para el reporte:", errorCarga);
        setError("No se pudo cargar la lista de usuarios.");
      } finally {
        setCargandoUsuarios(false);
      }
    }

    cargarUsuarios();
  }, []);

  function cambiarFiltro(setter, valor) {
    setter(valor);
    setReporte(null);
    setError("");
  }

  async function generarReporte(evento) {
    evento.preventDefault();
    setError("");
    setReporte(null);

    if (!usuarioId) {
      setError("Seleccione un usuario para generar el reporte.");
      return;
    }

    if (
      periodo === "rango" &&
      (!fechaInicio || !fechaFin || fechaInicio > fechaFin)
    ) {
      setError("Seleccione un rango de fechas válido.");
      return;
    }

    setGenerando(true);
    try {
      const [ordenes, sigas] = await Promise.all([
        obtenerJSON("/api/ordenes"),
        obtenerJSON("/api/sigas")
      ]);

      if (
        !Array.isArray(ordenes) ||
        !Array.isArray(sigas)
      ) {
        throw new Error("La API devolvió datos con un formato no válido.");
      }

      const [movimientosOrdenes, movimientosSIGA] = await Promise.all([
        cargarHistorialesOrdenes(ordenes),
        cargarHistorialesSIGAs(sigas)
      ]);
      const limites = crearLimitesPeriodo(periodo, fechaInicio, fechaFin);
      const esUsuario = (movimiento) =>
        String(movimiento.usuario_id).trim().toLowerCase() ===
        String(usuarioId).trim().toLowerCase();
      const estaEnPeriodo = (movimiento) => {
        const fecha = parsearFechaMovimiento(movimiento.fecha_movimiento);
        return fecha && fecha >= limites.desde && fecha < limites.hasta;
      };
      const numerosOrdenes = new Map(
        ordenes.map((orden) => [String(orden.id), orden.numero_ost])
      );
      const numerosSIGA = new Map(
        sigas.map((siga) => [String(siga.id), siga.numero_siga])
      );
      const limiteFinalInclusivo = new Date(limites.hasta.getTime() - 1);
      const etiquetaPeriodo = {
        hoy: "Hoy",
        "ultimos-7-dias": "Últimos 7 días",
        "mes-actual": "Mes actual",
        "ultimos-30-dias": "Últimos 30 días",
        "ultimo-ano": "Un año",
        rango: "Rango de fechas"
      }[periodo];
      const movimientosSIGAUsuario = movimientosSIGA.filter(esUsuario);
      const movimientosSIGAEnPeriodo =
        movimientosSIGAUsuario.filter(estaEnPeriodo);
      const movimientosOrdenesUsuario = movimientosOrdenes.filter(esUsuario);
      const movimientosOrdenesEnPeriodo =
        movimientosOrdenesUsuario.filter(estaEnPeriodo);
      const movimientosSIGAReporte = movimientosSIGAEnPeriodo
        .map((movimiento) => ({
          ...movimiento,
          numero: numerosSIGA.get(String(movimiento.siga_id)) || movimiento.siga_id
        }))
        .sort(
          (a, b) =>
            parsearFechaMovimiento(b.fecha_movimiento) -
            parsearFechaMovimiento(a.fecha_movimiento)
        );
      const movimientosOrdenesReporte = movimientosOrdenesEnPeriodo
        .map((movimiento) => ({
          ...movimiento,
          numero:
            numerosOrdenes.get(String(movimiento.orden_id)) ||
            movimiento.orden_id
        }))
        .sort(
          (a, b) =>
            parsearFechaMovimiento(b.fecha_movimiento) -
            parsearFechaMovimiento(a.fecha_movimiento)
        );

      setReporte({
        usuarioId,
        nombreUsuario:
          usuarios.find((usuario) => String(usuario.id) === String(usuarioId))
            ?.nombre || usuarioId,
        periodo: etiquetaPeriodo,
        desde: limites.desde,
        hasta: limiteFinalInclusivo,
        ordenes: movimientosOrdenesReporte,
        sigas: movimientosSIGAReporte,
        diagnosticoOrdenes: {
          movimientosCargados: movimientosOrdenes.length,
          delUsuario: movimientosOrdenesUsuario.length,
          enPeriodo: movimientosOrdenesEnPeriodo.length
        },
        diagnosticoSIGA: {
          movimientosCargados: movimientosSIGA.length,
          delUsuario: movimientosSIGAUsuario.length,
          enPeriodo: movimientosSIGAEnPeriodo.length
        }
      });
    } catch (errorReporte) {
      console.error("Error generando reporte de agentes:", errorReporte);
      setError(
        `No se pudo completar el reporte: ${errorReporte.message}`
      );
    } finally {
      setGenerando(false);
    }
  }

  function exportarReporteExcel() {
    if (!reporte) {
      return;
    }

    const crearFilas = (movimientos, identificador) => [
      [identificador, "Fecha y hora", "Movimiento"],
      ...movimientos.map((movimiento) => [
        movimiento.numero ?? "",
        formatearFechaHora(movimiento.fecha_movimiento),
        movimiento.comentario || movimiento.tipo_movimiento || "Movimiento"
      ])
    ];
    const libro = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      libro,
      XLSX.utils.aoa_to_sheet(crearFilas(reporte.ordenes, "OST")),
      "Órdenes"
    );
    XLSX.utils.book_append_sheet(
      libro,
      XLSX.utils.aoa_to_sheet(crearFilas(reporte.sigas, "SIGA")),
      "SIGAs"
    );
    XLSX.writeFile(
      libro,
      `Reporte_Agentes_${obtenerFechaCostaRica().replaceAll("-", "")}.xlsx`
    );
  }

  function renderizarTabla(titulo, movimientos, tipoRegistro) {
    return (
      <section style={{ marginTop: "28px", textAlign: "left" }}>
        <h3>{titulo} ({movimientos.length})</h3>
        <div style={{ overflowX: "auto" }}>
          <table
            className="ordenes-table"
            style={{
              borderCollapse: "collapse",
              width: "100%",
              marginTop: "12px"
            }}
          >
            <thead>
              <tr>
                <th>{tipoRegistro}</th>
                <th>Fecha y hora</th>
                <th>Movimiento</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.length ? movimientos.map((movimiento, indice) => (
                <tr key={`${tipoRegistro}-${movimiento.id || indice}`}>
                  <td>{movimiento.numero ?? "-"}</td>
                  <td>{formatearFechaHora(movimiento.fecha_movimiento)}</td>
                  <td>{movimiento.comentario || movimiento.tipo_movimiento || "Movimiento"}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center" }}>
                    No hay movimientos en el período seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <div style={{ textAlign: "left" }}>
      <h2>Reporte Agentes</h2>
      <p>Consulte los movimientos registrados por usuario en órdenes y SIGAs.</p>

      <form
        onSubmit={generarReporte}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "end",
          gap: "12px",
          marginTop: "22px"
        }}
      >
        <label style={{ display: "grid", gap: "6px", minWidth: "220px" }}>
          Usuario
          <select
            value={usuarioId}
            onChange={(evento) => cambiarFiltro(setUsuarioId, evento.target.value)}
            disabled={cargandoUsuarios}
            required
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}
          >
            <option value="">
              {cargandoUsuarios ? "Cargando usuarios..." : "Seleccione un usuario"}
            </option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nombre}{usuario.activo === false ? " (inactivo)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: "6px", minWidth: "190px" }}>
          Período
          <select
            value={periodo}
            onChange={(evento) => cambiarFiltro(setPeriodo, evento.target.value)}
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}
          >
            <option value="hoy">Hoy</option>
            <option value="ultimos-7-dias">Últimos 7 días</option>
            <option value="mes-actual">Mes actual</option>
            <option value="ultimos-30-dias">Últimos 30 días</option>
            <option value="ultimo-ano">Un año</option>
            <option value="rango">Rango de fechas</option>
          </select>
        </label>

        {periodo === "rango" && (
          <>
            <label style={{ display: "grid", gap: "6px" }}>
              Desde
              <input
                type="date"
                value={fechaInicio}
                onChange={(evento) => cambiarFiltro(setFechaInicio, evento.target.value)}
                required
                style={{ padding: "9px", borderRadius: "6px", border: "1px solid #d1d5db" }}
              />
            </label>
            <label style={{ display: "grid", gap: "6px" }}>
              Hasta
              <input
                type="date"
                value={fechaFin}
                onChange={(evento) => cambiarFiltro(setFechaFin, evento.target.value)}
                required
                style={{ padding: "9px", borderRadius: "6px", border: "1px solid #d1d5db" }}
              />
            </label>
          </>
        )}

        <button type="submit" disabled={generando || cargandoUsuarios}>
          {generando ? "Generando..." : "Generar reporte"}
        </button>
      </form>

      {error && (
        <p role="alert" style={{ color: "#b91c1c", marginTop: "16px" }}>
          {error}
        </p>
      )}

      {reporte && (
        <>
          <p style={{ marginTop: "24px" }}>
            Usuario: <strong>{reporte.nombreUsuario}</strong>
            {" · ID: "}
            <strong>{reporte.usuarioId}</strong>
            {" | "}
            Período: <strong>{reporte.periodo}</strong>
            {" ("}
            {reporte.desde.toLocaleDateString("es-CR", {
              timeZone: ZONA_HORARIA
            })}
            {" - "}
            {reporte.hasta.toLocaleDateString("es-CR", {
              timeZone: ZONA_HORARIA
            })}
            {")"}
          </p>
          {reporte.sigas.length === 0 && (
            <p style={{ marginTop: "8px" }}>
              Diagnóstico SIGA: se cargaron {reporte.diagnosticoSIGA.movimientosCargados} movimientos;
              {" "}{reporte.diagnosticoSIGA.delUsuario} corresponden al usuario seleccionado y
              {" "}{reporte.diagnosticoSIGA.enPeriodo} están dentro del período.
            </p>
          )}
          {reporte.ordenes.length === 0 && (
            <p style={{ marginTop: "8px" }}>
              Diagnóstico Órdenes: se cargaron {reporte.diagnosticoOrdenes.movimientosCargados} movimientos;
              {" "}{reporte.diagnosticoOrdenes.delUsuario} corresponden al usuario seleccionado y
              {" "}{reporte.diagnosticoOrdenes.enPeriodo} están dentro del período.
            </p>
          )}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginTop: "20px"
            }}
          >
            <div role="group" aria-label="Tabla de movimientos a visualizar" style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                aria-pressed={tablaActiva === "ordenes"}
                onClick={() => setTablaActiva("ordenes")}
                style={{ padding: "10px", fontWeight: tablaActiva === "ordenes" ? "700" : "400" }}
              >
                Órdenes ({reporte.ordenes.length})
              </button>
              <button
                type="button"
                aria-pressed={tablaActiva === "sigas"}
                onClick={() => setTablaActiva("sigas")}
                style={{ padding: "10px", fontWeight: tablaActiva === "sigas" ? "700" : "400" }}
              >
                SIGAs ({reporte.sigas.length})
              </button>
            </div>
            <button
              type="button"
              onClick={exportarReporteExcel}
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                cursor: "pointer"
              }}
            >
              📊 Exportar Excel
            </button>
          </div>
          {tablaActiva === "ordenes"
            ? renderizarTabla("Órdenes", reporte.ordenes, "OST")
            : renderizarTabla("SIGAs", reporte.sigas, "SIGA")}
        </>
      )}
    </div>
  );
}

export default ReporteAgentes;
