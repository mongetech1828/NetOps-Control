import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";

function SIGA() {

  const [sigas, setSigas] = useState([]);
  const [estadosSIGA, setEstadosSIGA] = useState([]);
  const [prioridadesSIGA, setPrioridadesSIGA] = useState([]);
  const [gruposGestion, setGruposGestion] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [tiposServicio, setTiposServicio] = useState([]);
  const [historialSIGA, setHistorialSIGA] =
    useState([]);
  const [sigaHistorial, setSigaHistorial] =
    useState(null);
  const [mostrarHistorial, setMostrarHistorial] =
  useState(false);
  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);
  const [sigaEditando, setSigaEditando] =
    useState(null);
  const formularioVacio = {
    numero_siga: "",
    numero_linea: "",
    evento_agil: "",
    cliente: "",
    prioridad_id: "",
    estado_siga_id: "",
    grupo_gestion_id: "",
    tecnico_id: "",
    tipo_servicio_id: "",
    nivel: "GT",
    fecha_recepcion: "",
    descripcion: "",
    observaciones: ""
  };
  const [formData, setFormData] =
    useState(formularioVacio);

  function calcularFechaMaximaSIGA(
    fechaRecepcion,
    horasSLA
  ) {
    const fecha = new Date(fechaRecepcion);
    fecha.setHours(
      fecha.getHours() + horasSLA
    );
    return fecha;
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

  function formatoFechaHora(fecha) {

    console.log("Original:", fecha);

    console.log(
      "Convertida:",
      new Date(fecha)
      .toLocaleString("es-CR", {
      timeZone: "America/Costa_Rica"
      })
      );

    return new Date(fecha).toLocaleString(
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

  function formatoFechaHistorial(fecha) {

    const fechaUtc = new Date(fecha);

    fechaUtc.setHours(
      fechaUtc.getHours() - 6
    );

    return fechaUtc.toLocaleString(
      "es-CR",
      {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit"
      }
    );
  }

  function cerrarFormularioSIGA() {
    setMostrarFormulario(false);
    setFormData(formularioVacio);
    setSigaEditando(null);
  }

  async function cargarSigas() {
    const { data } = await supabase
      .from("sigas")
      .select(`
        *,
        estados_siga(nombre),
        prioridades_siga(prioridad, horas_sla),
        grupos_gestion(nombre),
        tecnicos(nombre),
        tipo_servicio(nombre)
      `)
      .order("id", {
        ascending: false
      });
    setSigas(data || []);
  }

  function obtenerSLASIGA(fechaMaxima) {
    const horas =
      horasRestantesSIGA(
        fechaMaxima
      );
    if (horas < 0) {
      return "Vencido";
    }
    if (horas <= 1) {
      return "Por Vencer";
    }
    return "Dentro SLA";
  }

  async function cargarEstadosSIGA() {
    const { data } = await supabase
      .from("estados_siga")
      .select("*")
      .order("nombre");
    setEstadosSIGA(data || []);
  }

  async function cargarPrioridades() {
    const { data } = await supabase
      .from("prioridades_siga")
      .select("*")
      .order("prioridad");
    setPrioridadesSIGA(data || []);
  }

  async function cargarGrupos() {
    const { data } = await supabase
      .from("grupos_gestion")
      .select("*")
      .order("nombre");
    setGruposGestion(data || []);
  }

  async function cargarTiposServicio() {
    const { data } = await supabase
      .from("tipo_servicio")
      .select("*")
      .order("nombre");
    setTiposServicio(data || []);
  }

  async function cargarTecnicos() {

    const { data } = await supabase
      .from("tecnicos")
      .select("*")
      .order("nombre");
    setTecnicos(data || []);
  }

  async function guardarSIGA() {
    const prioridadSeleccionada = 
      prioridadesSIGA.find((p) => p.id === Number(formData.prioridad_id));
    const fechaMaxima = 
      calcularFechaMaximaSIGA(
          formData.fecha_recepcion,
          prioridadSeleccionada.horas_sla
      );
    const nivelCalculado =
      formData.tecnico_id
        ? "ST"
        : "GT";

    if (!formData.numero_siga) {alert("Debe indicar el número SIGA");
      return;
    }
    if (!formData.numero_linea) {alert("Debe indicar el número de línea");
      return;
    }
    if (!formData.cliente) {alert("Debe indicar el cliente");
      return;
    }
    if (!formData.tipo_servicio_id) {alert("Debe seleccionar el tipo de servicio");
      return;
    }
    if (!formData.prioridad_id) {alert("Debe seleccionar una prioridad");
      return;
    }
    if (!formData.estado_siga_id) {alert("Debe seleccionar un estado");
      return;
    }
    if (!formData.fecha_recepcion) {alert("Debe indicar la fecha y hora de recepción");
      return;
    }

    if (sigaEditando){
      const sigaActual = sigas.find(s => s.id ===sigaEditando);
      const {error} = await supabase
        .from ("sigas")
        .update({
          numero_linea: formData.numero_linea,
          evento_agil: formData.evento_agil,
          cliente: formData.cliente,
          tipo_servicio_id: formData.tipo_servicio_id? parseInt(formData.tipo_servicio_id): null,
          prioridad_id: formData.prioridad_id? parseInt(formData.prioridad_id): null,
          estado_siga_id: formData.estado_siga_id? parseInt (formData.estado_siga_id): null,
          grupo_gestion_id: formData.grupo_gestion_id? parseInt(formData.grupo_gestion_id) : null,
          tecnico_id: formData.tecnico_id? parseInt(formData.tecnico_id) : null,
          nivel: nivelCalculado,
          descripcion: formData.descripcion,
          observaciones: formData.observaciones
        })
        .eq("id", sigaEditando);
        
      if (error) {
        console.error(error);
        return;
      }

      const {data: {user}} = await supabase.auth.getUser();      

      if (
        sigaActual.estado_siga_id !==
        Number(formData.estado_siga_id)
      ){
        const estadoAnterior =
          estadosSIGA.find(
            e =>
              e.id ===
              sigaActual.estado_siga_id
          );
        const estadoNuevo =
          estadosSIGA.find(
            e =>
              e.id ===
              Number(formData.estado_siga_id)
          );
        const { error: historialError } =
          await supabase
            .from("historial_siga")
            .insert([
              {
                siga_id: sigaEditando,
                usuario_id: user.id,
                tipo_movimiento:
                  "Cambio Estado",
                estado_anterior:
                  sigaActual.estado_siga_id,
                estado_nuevo:
                  Number(
                    formData.estado_siga_id
                  ),
                comentario:
                  `Estado cambiado de ${estadoAnterior?.nombre} a ${estadoNuevo?.nombre}`
              }
            ]);

        if (historialError) {
          console.error(
            "ERROR HISTORIAL:",
            historialError
          );
        }
      }
    }
    else {
      const {data, error} = await supabase      
        .from("sigas")
        .insert([
          {
            numero_siga: formData.numero_siga,
            numero_linea: formData.numero_linea,
            evento_agil: formData.evento_agil,
            cliente: formData.cliente,
            tipo_servicio_id: formData.tipo_servicio_id ? parseInt(formData.tipo_servicio_id) : null,
            prioridad_id: formData.prioridad_id ? parseInt(formData.prioridad_id) : null,
            estado_siga_id: formData.estado_siga_id ? parseInt(formData.estado_siga_id) : null,
            grupo_gestion_id: formData.grupo_gestion_id ? parseInt(formData.grupo_gestion_id) : null,
            tecnico_id: formData.tecnico_id ? parseInt(formData.tecnico_id) : null,
            nivel: nivelCalculado,
            fecha_recepcion: formData.fecha_recepcion,
            fecha_maxima_atencion: fechaMaxima,
            descripcion: formData.descripcion,
            observaciones: formData.observaciones
          }
        ])
        .select()
        .single();
      if (error){
        console.error(error);
        return;
      }

      const { data: {user} } = await supabase.auth.getUser();

      const {error: historialError} = await supabase
        .from("historial_siga")
        .insert([
          {
            siga_id: data.id,
            usuario_id: user.id,
            tipo_movimiento: "Creación",
            estado_nuevo: Number(
              formData.estado_siga_id
            ),
            comentario:
              `Creación del reporte SIGA ${formData.numero_siga} por el usuario ${user.email}`
          }
        ]);

      if (historialError) {
        console.error(
          "ERROR HISTORIAL SIGA: ",
          historialError
        );
      }
    }

    await cargarSigas();
    cerrarFormularioSIGA();
  }

  function editarSIGA(siga) {

    setSigaEditando(siga.id);
    setFormData({
      numero_siga: siga.numero_siga || "",
      numero_linea: siga.numero_linea || "",
      evento_agil: siga.evento_agil || "",
      cliente: siga.cliente || "",
      tipo_servicio_id:
        siga.tipo_servicio_id || "",
      prioridad_id:
        siga.prioridad_id || "",
      estado_siga_id:
        siga.estado_siga_id || "",
      grupo_gestion_id:
        siga.grupo_gestion_id || "",
      tecnico_id:
        siga.tecnico_id || "",
      fecha_recepcion:
        siga.fecha_recepcion? siga.fecha_recepcion.substring(0,16): "",
      descripcion:
        siga.descripcion || "",
      observaciones:
        siga.observaciones || ""
    });

    setMostrarFormulario(true);
  }

  async function cargarHistorialSIGA(siga) {
    setSigaHistorial(siga);
    const { data } = await supabase
      .from("historial_siga")
      .select(`
        *,
        estados_siga!estado_nuevo(nombre)
      `)
      .eq("siga_id", siga.id)
      .order("fecha_movimiento", {
        ascending: false
      });

    console.log(
      "HISTORIAL SIGA:",
      data
    );

    setHistorialSIGA(data || []);
    setMostrarHistorial(true);
  }

  useEffect(() => {
    cargarSigas();
    cargarEstadosSIGA();
    cargarPrioridades();
    cargarGrupos();
    cargarTecnicos();
    cargarTiposServicio();
  }, []);



  return (
    <div>
      <h1>SIGA</h1>

      <button
        onClick={() => {
          setSigaEditando(null);
          setFormData(formularioVacio);
          setMostrarFormulario(true);
        }}
      >
        Nuevo SIGA
      </button>

      <hr
        style={{
          margin: "20px 0"
        }}
      />

      <h2>SIGAs Registrados</h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
        }}
      >

        <thead>
          <tr>
            <th>SIGA</th>
            <th>Línea</th>
            <th>Evento AGIL</th>
            <th>Cliente</th>
            <th>Servicio</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Grupo</th>
            <th>Horas</th>
            <th>SLA</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {sigas.map((siga) => (
            <tr key={siga.id}>

              <td>{siga.numero_siga}</td>
              <td>{siga.numero_linea}</td>
              <td>{siga.evento_agil}</td>
              <td>{siga.cliente}</td>
              <td>{siga.tipo_servicio?.nombre || "-"}</td>
              <td>{siga.prioridades_siga?.prioridad}</td>
              <td>{siga.estados_siga?.nombre}</td>
              <td>{siga.grupos_gestion?.nombre}</td>
              <td>{siga.fecha_maxima_atencion? horasRestantesSIGA(siga.fecha_maxima_atencion).toFixed(1): "-"}</td>
              <td>
                <span
                  style={{
                    color:
                      obtenerSLASIGA(
                        siga.fecha_maxima_atencion
                      ) === "Vencido"
                        ? "red"
                        : obtenerSLASIGA(
                            siga.fecha_maxima_atencion
                          ) === "Por Vencer"
                        ? "orange"
                        : "green",
                    fontWeight: "bold"
                  }}
                >
                  {
                    obtenerSLASIGA(
                      siga.fecha_maxima_atencion
                    )
                  }
                </span>
              </td>
              <td>
                <button
                  onClick={() => editarSIGA(siga)}
                >
                  Editar
                </button>
                <button
                  onClick ={() =>
                    cargarHistorialSIGA(siga)
                  }
                >
                  Historial
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {
        mostrarFormulario && (

          <div className="modal-overlay">
            <div className="modal-content">

              <h3>
                {sigaEditando
                  ? "Editar SIGA"
                  : "Nuevo SIGA"}
              </h3>

              <br/><br/>

              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  marginBottom: "15px",
                  justifyContent: "center"
                }}
              >

                <input
                  placeholder="Número SIGA"
                  value={formData.numero_siga || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numero_siga: e.target.value
                    })
                  }
                />

                <input
                  placeholder="Número Línea"
                  value={formData.numero_linea || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numero_linea: e.target.value
                    })
                  }
                />

                <input
                  placeholder="Evento AGIL"
                  value={formData.evento_agil || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      evento_agil: e.target.value
                    })
                  }
                />
              </div>

              <input
                style={{
                  width: "100%",
                  marginBottom: "15px",
                  justifyContent: "center"
                }}
                placeholder="Cliente"
                value={formData.cliente || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cliente: e.target.value
                  })
                }
              />

              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  marginBottom: "15px",
                  justifyContent: "center"
                }}
              >
                <select
                  value={formData.tipo_servicio_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipo_servicio_id: e.target.value
                    })
                  }
                >
                  <option value="">
                    Tipo Servicio
                  </option>
                  {tiposServicio.map((tipo) => (
                    <option
                      key={tipo.id}
                      value={tipo.id}
                    >
                      {tipo.nombre}
                    </option>
                  ))}
                </select>

                <select
                  value={formData.prioridad_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      prioridad_id: e.target.value
                    })
                  }
                >
                  <option value="">
                    Prioridad
                  </option>
                  {prioridadesSIGA.map((prioridad) => (
                    <option
                      key={prioridad.id}
                      value={prioridad.id}
                    >
                      {prioridad.prioridad}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  justifyContent: "center",
                  marginBottom: "15px"
                }}
              >
                <select
                  value={formData.estado_siga_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estado_siga_id: e.target.value
                    })
                  }
                >
                  <option value="">
                    Estado
                  </option>

                  {estadosSIGA.map((estado) => (
                    <option
                      key={estado.id}
                      value={estado.id}
                    >
                      {estado.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  justifyContent: "center",
                  marginBottom: "15px"
                }}
              >
                <select
                  value={formData.grupo_gestion_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      grupo_gestion_id: e.target.value
                    })
                  }
                >
                  <option value="">
                    Grupo Gestión
                  </option>

                  {gruposGestion.map((grupo) => (
                    <option
                      key={grupo.id}
                      value={grupo.id}
                    >
                      {grupo.nombre}
                    </option>
                  ))}
                </select>

                <select
                  value={formData.tecnico_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tecnico_id: e.target.value
                    })
                  }
                >

                  <option value="">
                    Técnico
                  </option>

                  {tecnicos.map((tecnico) => (

                    <option
                      key={tecnico.id}
                      value={tecnico.id}
                    >
                      {tecnico.nombre}
                    </option>

                  ))}

                </select>
              </div>

              <br/>

              <input                    
                type="datetime-local"
                value={formData.fecha_recepcion || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fecha_recepcion: e.target.value})
                }
                disabled={sigaEditando !== null}
                style={{width: "180px", backgroundColor: sigaEditando !== null ? "#f3f4f6" : "white" }}
              />

              <br/><br/>

              <textarea
                placeholder="Descripción"
                value={formData.descripcion || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    descripcion: e.target.value
                  })
                }
                rows={3}
                style={{
                  width: "80%",
                  marginBottom: "15px"
                }}
              />

              <br/><br/>

              <textarea
                placeholder="Observaciones"
                value={formData.observaciones || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    observaciones: e.target.value
                  })
                }
                rows={3}
                style={{
                  width: "80%",
                  marginBottom: "15px"
                }}
              />

              <br/><br/>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "10px"
                }}
              >

                <button
                  onClick={guardarSIGA}>
                  Guardar SIGA
                </button>

                <button
                  onClick={cerrarFormularioSIGA}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        mostrarHistorial && (
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
                  {sigaHistorial?.tecnicos?.nombre || "-"}
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
                  {obtenerSLASIGA(sigaHistorial?.fecha_maxima_atencion)}
                </div>

                <div>
                  <strong>Tiempo Consumido:</strong><br />
                  Pendiente
                </div>

                <div>
                  <strong>Tiempo Diferido:</strong><br />
                  Pendiente
                </div>

                <div>
                  <strong>Cumplimiento SLA:</strong><br />
                  Pendiente
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

              {historialSIGA.map((mov) => (

                <div
                  key={mov.id}
                  style={{
                    borderLeft: "3px solid #6366f1",
                    paddingLeft: "15px",
                    marginBottom: "15px"
                  }}
                >

                  <strong>
                    {mov.tipo_movimiento}
                  </strong>

                  <br />

                  <small>
                    {formatoFechaHistorial(
                      mov.fecha_movimiento
                    )}
                  </small>                 

                  <br />

                  {mov.comentario}

                </div>
                
              ))}

              <button
                onClick={() =>
                  setMostrarHistorial(false)
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

export default SIGA;