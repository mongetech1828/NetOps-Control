import { supabase } from "../services/supabase";

export async function cargarMovimientosSIGA() {

  try {

    const response =
      await fetch(
        "/api/historial-siga"
      );

    if (!response.ok) {

      return {
        data: null,
        error: true
      };

    }

    const data =
      await response.json();

    return {
      data,
      error: null
    };

  } catch (error) {

    return {
      data: null,
      error
    };

  }

}

export function parsearFechaMovimientoSIGA(fecha) {
  if (!fecha) return null;

  let valor = String(fecha).trim().replace(" ", "T");
  valor = valor.replace(
    /(\.\d{3})\d+(?=Z|[+-]\d{2}(?::?\d{2})?$|$)/i,
    "$1"
  );

  if (!/(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(valor)) {
    valor = `${valor}Z`;
  }

  const fechaParseada = new Date(valor);
  return Number.isNaN(fechaParseada.getTime()) ? null : fechaParseada;
}

export function calcularHorasRestantesSIGA(
  fechaMaxima,
  movimientos = [],
  estado = "",
  ahora = new Date()
) {
  const fechaLimite = new Date(fechaMaxima);
  if (Number.isNaN(fechaLimite.getTime())) return null;

  const eventos = movimientos
    .map((movimiento) => ({
      tipo: movimiento.tipo_movimiento,
      fecha: parsearFechaMovimientoSIGA(movimiento.fecha_movimiento)
    }))
    .filter(({ fecha }) => fecha)
    .sort((a, b) => a.fecha - b.fecha);

  let inicioDiferido = null;
  let tiempoDiferido = 0;
  let fechaFinalizacion = null;

  for (const evento of eventos) {
    if (evento.tipo === "Inicio Diferido" && !inicioDiferido) {
      inicioDiferido = evento.fecha;
    } else if (evento.tipo === "Fin Diferido" && inicioDiferido) {
      tiempoDiferido += Math.max(0, evento.fecha - inicioDiferido);
      inicioDiferido = null;
    } else if (
      (evento.tipo === "Cierre" || evento.tipo === "Restablecimiento") &&
      !fechaFinalizacion
    ) {
      fechaFinalizacion = evento.fecha;
      if (inicioDiferido) {
        tiempoDiferido += Math.max(0, evento.fecha - inicioDiferido);
        inicioDiferido = null;
      }
      break;
    }
  }

  const esFinalizado = estado === "Cerrado" || estado === "Restablecimiento";
  if (esFinalizado && !fechaFinalizacion) return null;

  const fechaEvaluacion = fechaFinalizacion || ahora;
  if (inicioDiferido) {
    tiempoDiferido += Math.max(0, fechaEvaluacion - inicioDiferido);
  } else if (estado === "Diferido" && !fechaFinalizacion) {
    return null;
  }

  const fechaLimiteAjustada = new Date(
    fechaLimite.getTime() + tiempoDiferido
  );
  return (fechaLimiteAjustada - fechaEvaluacion) / (1000 * 60 * 60);
}
