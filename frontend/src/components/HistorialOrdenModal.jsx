function formatoFechaHora(fecha) {

    console.log("Original:", fecha);

    console.log(
        "Convertida:",
        new Date(fecha)
        .toLocaleString("es-CR", {
        timeZone: "America/Costa_Rica"
        })
        );

    return new Date(fecha + "Z").toLocaleString(
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


function formatoFecha(fecha) {
    return new Date(fecha).toLocaleDateString("es-CR");
}


function HistorialOrdenModal({

  visible,
  ordenHistorial,
  historialOrden,
  onClose

}) {

    if (!visible) return null;

    return (

        <div className="modal-overlay">

            <div className="modal-content">

                <h3>
                    Historial OST {ordenHistorial?.numero_ost}
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
                        {ordenHistorial?.cliente}
                    </div>

                    <div>
                        <strong>Evento Ágil:</strong><br />
                        {ordenHistorial?.evento_agil || "-"}
                    </div>                

                    <div>
                        <strong>Servicio:</strong><br />
                        {ordenHistorial?.tipo_servicio?.nombre || "-"}
                    </div>

                    <div>
                        <strong>Transporte:</strong><br />
                        {ordenHistorial?.transporte?.nombre || "-"}
                    </div>

                    <div>
                        <strong>Estado Actual:</strong><br />
                        {ordenHistorial?.estado?.nombre}
                    </div>

                    <div>
                        <strong>Reingresos:</strong><br />
                        {ordenHistorial?.cantidad_reingresos}
                    </div>

                    <div>
                        <strong>Fecha Recepción:</strong><br />
                        {formatoFecha(
                            ordenHistorial?.fecha_recepcion
                        )}
                    </div>

                    <div>
                        <strong>Fecha Máxima:</strong><br />
                        {formatoFecha(
                            ordenHistorial?.fecha_maxima_atencion
                        )}
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
                        {ordenHistorial?.orden_tecnicos
                            ?.map((ot) => (
                            <span
                                key={ot.tecnico_id}
                                style={{
                                    backgroundColor: "#dbeafe",
                                    color: "#1e40af",
                                    padding: "4px 8px",
                                    borderRadius: "12px",
                                    fontSize: "12px"
                                }}
                            >
                                {ot.tecnicos?.nombre}
                            </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginTop: "20px" }}
                >
                    <div
                        style={{
                        flex: 1,
                        textAlign: "left",
                        }}
                    >                      
                        <strong>Observaciones:</strong><br />
                        {ordenHistorial?.observaciones || "-"}

                    </div>

                    {/* Prioridad */}                
                    <div
                        style={{
                            minWidth: "180px",
                            textAlign: "left",
                            marginLeft: "30px"
                        }}
                    >
                        <strong>
                        {
                            ordenHistorial
                            ?.prioridad_calculada
                        }
                        </strong>

                        {" "}
                        (
                        {
                        ordenHistorial
                            ?.puntaje_prioridad
                        }
                        )

                        <br />

                        IVC: {ordenHistorial?.ivc?.[0]}
                        {" | "}

                        UC: {ordenHistorial?.uc?.[0]}

                        <br />

                        FO: {ordenHistorial?.fo?.[0]}
                        {" | "}

                        CRC: {ordenHistorial?.crc?.[0]}
                    </div>
                </div>

                <hr style={{ margin: "20px 0"}} />

                <h3>Timeline OST</h3>

                <div
                    style={{
                        width: "700px",
                        margin: "0 auto"
                    }}
                >

                    {historialOrden.map((item) => {

                        let color ="#2563eb";

                        if (item.comentario.includes("Creación")) {
                        color = "#22c55e"
                        }

                        if (item.comentario.includes("Cambio de estado")) {
                        color = "#3b82f6"
                        }

                        if (item.comentario.includes("reingresada")) {
                        color = "#f59e0b"
                        }

                        return (

                        <div
                            key={item.id}
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                marginBottom: "20px"
                            }}
                        >
                            <div
                                style={{
                                    width: "40px",
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
                                    width: "500px"
                                }}
                            >
                                <div>
                                    <strong>
                                        {formatoFechaHora(
                                            item.fecha_movimiento
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    {item.comentario}
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
    )

};

export default HistorialOrdenModal;