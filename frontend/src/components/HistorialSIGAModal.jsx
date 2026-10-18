function parsearFechaMovimiento(fecha) {
  if (!fecha) {
    return null;
  }

  if (typeof fecha !== "string") {
    const fechaParseada = new Date(fecha);
    return Number.isNaN(fechaParseada.getTime()) ? null : fechaParseada;
  }

  let valor = fecha.trim().replace(" ", "T");
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

function formatoFechaHora(fecha) {
    const fechaParseada = parsearFechaMovimiento(fecha);
    if (!fechaParseada) {
      return "-";
    }

    return fechaParseada.toLocaleString(
        "es-CR",
        {
        timeZone: "America/Costa_Rica",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit"
        }
    );

}


function calcularMetricasSIGA(
    historialSIGA,
    horasSLA
  ) {
    const movimientos = [...(historialSIGA || [])]
      .sort(
        (a, b) =>
          parsearFechaMovimiento(a.fecha_movimiento) -
          parsearFechaMovimiento(b.fecha_movimiento)
      );
    let tiempoConsumido = 0;
    let tiempoDiferido = 0;
    let inicioActivo = null;
    let inicioDiferido = null;
    let finalizado = false;

    movimientos.forEach((mov) => {
      const fecha = parsearFechaMovimiento(mov.fecha_movimiento);
      if (!fecha) {
        return;
      }

      switch (mov.tipo_movimiento) {
        case "Creación":
          inicioActivo = fecha;
          break;
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

    const ahora = new Date();
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

function horasRestantesSIGA(fechaMaxima) {
    const ahora = new Date();
    const fechaLimite = new Date(
      fechaMaxima
    );
    const diferencia =
      fechaLimite - ahora;
    return diferencia / (1000 * 60 * 60);
  }

function formatoFechaHistorial(fecha) {
  if (!fecha) {
    return "-";
  }

  const fechaUtc = parsearFechaMovimiento(fecha);
  if (!fechaUtc) {
    return "-";
  }

  const fechaCostaRica = new Date(Date.UTC(
    fechaUtc.getUTCFullYear(),
    fechaUtc.getUTCMonth(),
    fechaUtc.getUTCDate(),
    fechaUtc.getUTCHours() - 6,
    fechaUtc.getUTCMinutes(),
    fechaUtc.getUTCSeconds()
  ));

  return new Intl.DateTimeFormat("es-CR", {
    timeZone: "UTC",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(fechaCostaRica);
}

function obtenerSLASIGA(fechaMaxima) {
    const horas = horasRestantesSIGA(fechaMaxima);

    if (horas < 0) {
      return {texto: "⚫Vencido",color: "#dc2626",};}
    if (horas <= 1) {
      return {texto: "🟡Prox. vencer",color: "#eab308",};}
    return {texto: "🟢Dentro SLA",color: "#16a34a",};
}

function formatearHoras(
    horas
  ) {
    const horasEnteras =
      Math.floor(horas);
    const minutos =
      Math.round(
        (horas - horasEnteras) * 60
      );

    return `${horasEnteras}h ${minutos}m`;
  }

function HistorialSIGAModal({

  visible,
  sigaHistorial,
  historialSIGA,
  onClose

}) {

    console.log("VISIBLE:", visible);

  if (!visible) return null;

  const metricas = sigaHistorial
  ? calcularMetricasSIGA(
      historialSIGA,
      sigaHistorial?.prioridades_siga?.horas_sla || 0
    )
  : null;

  return (

    <div className="modal-overlay">
      <div className="modal-content">
        
        <h3>
            Historial SIGA {sigaHistorial?.numero_siga}
        </h3>

        <div
            style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "20px",
            marginBottom: "20px"
            }}
        >
            <div>
            <strong>Cliente:</strong><br />
            {sigaHistorial?.cliente || "-"}
            </div>

            <div>
            <strong>Evento AGIL:</strong><br />
            {sigaHistorial?.evento_agil || "-"}
            </div>

            <div>
            <strong>Prioridad:</strong><br />
            {sigaHistorial?.prioridades_siga?.prioridad}
            </div>

            <div>
            <strong>Línea:</strong><br />
            {sigaHistorial?.numero_linea}
            </div>

            <div>
            <strong>Tipo Servicio:</strong><br />
            {sigaHistorial?.tipo_servicio?.nombre}
            </div>                

            <div>
            <strong>Estado:</strong><br />
            {sigaHistorial?.estados_siga?.nombre}
            </div>

            <div>
            <strong>Nivel:</strong><br />
            {sigaHistorial?.nivel}
            </div>

            <div>
            <strong>Grupo de gestión:</strong><br />
            {sigaHistorial?.grupos_gestion?.nombre || "-"}
            </div>

            <div>
            <strong>Técnico:</strong><br />
            <div
                style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginTop: "5px"
                }}
            >
                {sigaHistorial?.siga_tecnicos
                ?.map((st) => (
                    <span
                    key={st.tecnico_id}
                    style={{
                        backgroundColor: "#dbeafe",
                        color: "#1e40af",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px"
                    }}
                    >
                    {st.tecnicos?.nombre}
                    </span>
                ))}
            </div>
            </div>

            <div>
            <strong>Fecha Recpeción:</strong><br />
            {formatoFechaHora(sigaHistorial?.fecha_recepcion)}
            </div>

            <div>
            <strong>F. Máxima Atención:</strong><br />
            {formatoFechaHora(sigaHistorial?.fecha_maxima_atencion)}
            </div>

            <div>
            <strong>SLA:</strong><br />
            {obtenerSLASIGA(sigaHistorial?.fecha_maxima_atencion).texto}
            </div>

            <div>
            <strong>Tiempo Consumido:</strong><br />
            {formatearHoras(
                metricas?.tiempoConsumidoHoras || 0
            )}
            </div>

            <div>
            <strong>Tiempo Diferido:</strong><br />
            {formatearHoras(
                metricas?.tiempoDiferidoHoras || 0
            )}
            </div>

            <div>
            <strong>Tiempo Total:</strong><br />
            {formatearHoras(
                metricas?.tiempoTotalHoras || 0
            )}
            </div>

            <div
            style={{
                gridColumn: "1 / span 3",
                textAlign: "center",
                marginTop: "10px",
                padding: "15px",
                borderRadius: "8px",
                backgroundColor: metricas?.cumpleSLA
                ? "#ecfdf5"
                : "#fef2f2"
            }}
            >
            <strong
                style={{
                display: "block",
                marginBottom: "10px"
                }}
            >
                Cumplimiento SLA
            </strong>

            <span
                style={{
                color:
                    metricas?.cumpleSLA
                    ? "#16a34a"
                    : "#dc2626",
                fontWeight: "bold",
                fontSize: "1.3rem"
                }}
            >
                {
                metricas?.cumpleSLA
                    ? "✅ CUMPLE"
                    : "❌ INCUMPLE"
                }
            </span>
            </div>
        </div>

        <div style={{ marginTop: "20px" }}>
            <strong>Descripción:</strong><br />
            {sigaHistorial?.descripcion || "-"}
        </div>

        <br/>

        <div>
            <strong>Observaciones:</strong><br />
            {sigaHistorial?.observaciones || "-"}
        </div>

        <hr style={{ margin: "20px 0"}} />

        <h3>Timeline SIGA</h3>

        <div
            style={{
            width: "100%",
            maxWidth: "700px",
            margin: "0 auto",
            boxSizing: "border-box"
            }}
        >

            {historialSIGA.map((mov) => {

            let color = "#2563eb";

            const tipoMovimiento = mov.tipo_movimiento || "";

            if (tipoMovimiento.includes("Creación")) {
                color = "#22c55e"
            }
            if (tipoMovimiento.includes("Cambio Estado")) {
                color = "#3b82f6"
            }
            if (tipoMovimiento.includes("Cierre")) {
                color = "#64748b"
            }
            if (tipoMovimiento.includes("Asignación Técnico")) {
                color = "#06b6d4"
            }
            if (tipoMovimiento.includes("Inicio Diferido")) {
                color = "#f59e0b"
            }
            if (tipoMovimiento.includes("Fin Diferido")) {
                color = "#84cc16"
            }
            if (tipoMovimiento.includes("Restablecimiento")) {
                color = "#0ea5e9"
            }
            if (tipoMovimiento.includes("Cambio Grupo Gestión")) {
                color = "#8b5cf6"
            }              
            const comentario = mov.comentario || "";
            const correo = mov.perfiles?.correo;
            const mostrarCorreo = correo &&
                !comentario.toLowerCase().includes(correo.toLowerCase());

            return (
                <div
                key={mov.id}
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    marginBottom: "20px"
                }}
                >
                <div
                    style={{
                    width: "40px",
                    flex: "0 0 40px",
                    display: "flex",
                    justifyContent: "center"
                    }}
                >
                    <div
                    style={{
                        width: "12px",
                        height: "12px",
                        backgroundColor: color,
                        borderRadius: "50%",
                        marginTop: "5px"
                    }}
                    />
                </div>

                <div
                    style={{
                    borderLeft: "2px solid #d1d5db",
                    paddingLeft: "20px",
                    marginLeft: "-6px",
                    textAlign: "left",
                    width: "500px",
                    maxWidth: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                    overflowWrap: "anywhere"
                    }}
                >
                    
                    <div
                    style={{
                        fontWeight: "600",
                        marginBottom: "4px",
                    }}
                    >
                    {formatoFechaHistorial(
                        mov.fecha_movimiento
                    )}
                    </div>
                    <div>
                    <span style={{ overflowWrap: "anywhere" }}>
                        {comentario}
                        {mostrarCorreo && ` por ${correo}`}
                    </span>
                    </div>

                </div>
                </div>
            );
            })}

        </div>

        <button
            style={{
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer"
            }}
            onClick={onClose}
        >
            Cerrar
        </button>              

      </div>

    </div>

  );

}

export default HistorialSIGAModal;