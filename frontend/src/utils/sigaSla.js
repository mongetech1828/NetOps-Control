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

function parsearFechaMovimiento(fecha) {
  if (!fecha) {
    return null;
  }

  if (typeof fecha !== "string") {
    const fechaParseada = new Date(fecha);
    return Number.isNaN(fechaParseada.getTime()) ? null : fechaParseada;
  }

  let valor = fecha.trim().replace(" ", "T");

  const fechaParseada = new Date(valor);
  return Number.isNaN(fechaParseada.getTime()) ? null : fechaParseada;
}

export function calcularMetricasSIGA(
  historialSIGA,
  horasSLA,
  fechaRecepcion,
  ahora = new Date()
) {
  const movimientos = [...(historialSIGA || [])]
    .sort(
      (a, b) =>
        parsearFechaMovimiento(a.fecha_movimiento) -
        parsearFechaMovimiento(b.fecha_movimiento)
    );
  let tiempoConsumido = 0;
  let tiempoDiferido = 0;
  let inicioActivo = fechaRecepcion ? new Date(fechaRecepcion) : null;
  let inicioDiferido = null;
  let finalizado = false;

  movimientos.forEach((mov) => {
    const fecha = parsearFechaMovimiento(mov.fecha_movimiento);
    if (!fecha) {
      return;
    }

    switch (mov.tipo_movimiento) {
      case "Inicio Diferido":
        if (inicioActivo) {
          tiempoConsumido += fecha - inicioActivo;
          inicioActivo = null;
        }
        inicioDiferido = fecha;
        break;
      case "Fin Diferido":
        if (inicioDiferido) {
          tiempoDiferido += fecha - inicioDiferido;
          inicioDiferido = null;
        }
        inicioActivo = fecha;
        break;
      case "Restablecimiento":
      case "Cierre":
        if (inicioActivo && !finalizado) {
          tiempoConsumido += fecha - inicioActivo;
          inicioActivo = null;
        }
        if (inicioDiferido && !finalizado) {
          tiempoDiferido += fecha - inicioDiferido;
          inicioDiferido = null;
        }
        finalizado = true;
        break;
      default:
        break;
    }
  });

  if (!finalizado && inicioActivo) {
    tiempoConsumido += ahora - inicioActivo;
  }
  if (!finalizado && inicioDiferido) {
    tiempoDiferido += ahora - inicioDiferido;
  }

  const tiempoConsumidoHoras = tiempoConsumido / (1000 * 60 * 60);
  const tiempoDiferidoHoras = tiempoDiferido / (1000 * 60 * 60);
  const tiempoTotalHoras = tiempoConsumidoHoras + tiempoDiferidoHoras;

  return {
    tiempoConsumidoHoras,
    tiempoDiferidoHoras,
    tiempoTotalHoras,
    cumpleSLA: tiempoConsumidoHoras <= horasSLA
  };
}

export function calcularDatosSLAActualSIGA(
  siga,
  movimientos = [],
  horasSLA,
  ahora = new Date()
) {
  const horasSLAValidas = Number(horasSLA);
  const fechaRecepcion = siga.fecha_recepcion
    ? new Date(siga.fecha_recepcion)
    : null;
  const fechaRecepcionValida =
    fechaRecepcion && Number.isFinite(fechaRecepcion.getTime());
  const metricas = Number.isFinite(horasSLAValidas) && fechaRecepcionValida
    ? calcularMetricasSIGA(
      movimientos,
      horasSLAValidas,
      fechaRecepcion,
      ahora
    )
    : null;
  const horasRestantes = metricas
    ? Math.max(0, horasSLAValidas - metricas.tiempoConsumidoHoras)
    : calcularHorasRestantesSIGA(
      siga.fecha_maxima_atencion,
      movimientos,
      siga.estado,
      ahora
    );
  const fechaMaximaDinamica = metricas
    ? calcularFechaMaximaDinamicaSIGA(
      metricas.tiempoConsumidoHoras,
      horasSLAValidas,
      ahora.getTime()
    )
    : null;

  return {
    metricas,
    horasRestantes,
    fechaMaximaDinamica,
    cumpleSLA: metricas
      ? metricas.cumpleSLA
      : horasRestantes === null
        ? null
        : horasRestantes >= 0
  };
}

export function clasificarSLAActualSIGA(siga, horasRestantes, cumpleSLA) {
  if (
    siga.estado === "Cerrado" ||
    siga.estado === "Diferido" ||
    horasRestantes === null ||
    horasRestantes === undefined ||
    !Number.isFinite(Number(horasRestantes))
  ) {
    return null;
  }

  if (cumpleSLA === false || horasRestantes <= 0) {
    return "vencido";
  }
  if (horasRestantes <= 1) {
    return "por-vencer";
  }
  return "dentro-sla";
}

export function calcularFechaMaximaDinamicaSIGA(
  tiempoConsumidoHoras,
  horasSLA,
  ahora = Date.now()
) {
  const horasConsumidas = Number(tiempoConsumidoHoras);
  const horasDisponibles = Number(horasSLA);
  if (
    !Number.isFinite(horasConsumidas) ||
    !Number.isFinite(horasDisponibles)
  ) {
    return null;
  }

  const horasRestantes = Math.max(
    0,
    horasDisponibles - horasConsumidas
  );
  return new Date(ahora + horasRestantes * 60 * 60 * 1000);
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
