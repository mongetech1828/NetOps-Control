import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../services/supabase";

function SIGA() {

  const [sigas, setSigas] = useState([]);
  const [filtroSIGA, setFiltroSIGA] = useState("");
  const [filtroLinea, setFiltroLinea] = useState("");
  const [filtroEvento, setFiltroEvento] = useState("");
  const [estadosSIGA, setEstadosSIGA] = useState([]);
  const [filtroDashboard, setFiltroDashboard] = useState("");
  const [prioridadesSIGA, setPrioridadesSIGA] = useState([]);
  const [gruposGestion, setGruposGestion] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [tiposServicio, setTiposServicio] = useState([]);
  const [mostrarTecnicos, setMostrarTecnicos] = useState(false);
  const [
    tecnicosSeleccionados,
    setTecnicosSeleccionados
  ] = useState([]);
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
    setTecnicosSeleccionados([]);
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
        siga_tecnicos(tecnico_id,tecnicos(id, nombre)),
        tipo_servicio(nombre)
      `)
      .order("id", {
        ascending: false
      });
    setSigas(data || []);
    console.log(data);
  }

  function obtenerSLASIGA(fechaMaxima) {
    const horas = horasRestantesSIGA(fechaMaxima);

    if (horas < 0) {
      return {texto: "⚫Vencido",color: "#dc2626",};}
    if (horas <= 1) {
      return {texto: "🟡Prox. vencer",color: "#eab308",};}
    return {texto: "🟢Dentro SLA",color: "#16a34a",};
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
      
    const {data: sigaExistente} = await supabase
      .from("sigas")
      .select("id")
      .eq("numero_siga", formData.numero_siga.trim())
      .single();

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

    if (!sigaEditando && sigaExistente) {
      alert("Ya existe un SIGA con ese número. Utilice Editar para modificarlo.");

      setFormData(formularioVacio);
      setTecnicosSeleccionados([]);

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
          tecnico_id: tecnicosSeleccionados.length > 0 ? tecnicosSeleccionados[0] : null,
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
                tipo_movimiento: "Cambio Estado",
                estado_anterior: sigaActual.estado_siga_id,
                estado_nuevo:
                  Number(
                    formData.estado_siga_id
                  ),
                comentario: `Estado cambiado de ${estadoAnterior?.nombre} a ${estadoNuevo?.nombre}`
              }
            ]);

            if (
              estadoNuevo?.nombre === "Diferido"
            ) {
              await supabase
                .from("historial_siga")
                .insert([
                  {
                    siga_id: sigaEditando,
                    usuario_id: user.id,
                    tipo_movimiento:"Inicio Diferido",
                    comentario:"El reporte fue colocado en estado Diferido"
                  }
                ]);
            }

            if (
              estadoAnterior?.nombre === "Diferido" &&
              estadoNuevo?.nombre !== "Diferido"
            ) {
              await supabase
                .from("historial_siga")
                .insert([
                  {
                    siga_id: sigaEditando,
                    usuario_id: user.id,
                    tipo_movimiento:"Fin Diferido",
                    comentario:"El reporte salió del estado Diferido"
                  }
                ]);
            }
            
            if (
              estadoNuevo?.nombre === "Restablecimiento"
            ) {

              await supabase
                .from("historial_siga")
                .insert([
                  {
                    siga_id: sigaEditando,
                    usuario_id: user.id,
                    tipo_movimiento:"Restablecimiento",
                    comentario:"Servicio restablecido"
                  }
                ]);

            }

            if (
              estadoNuevo?.nombre === "Cerrado"
            ) {

              await supabase
                .from("historial_siga")
                .insert([
                  {
                    siga_id: sigaEditando,
                    usuario_id: user.id,
                    tipo_movimiento:"Cierre",
                    comentario:"Reporte cerrado"
                  }
                ]);

            }
        
        if (historialError) {
        console.error(
          "ERROR HISTORIAL:",
          historialError
          );
        }
      }

      await supabase
      .from("siga_tecnicos")
      .delete()
      .eq("siga_id",sigaEditando);
      if (
        tecnicosSeleccionados.length > 0          
      ) {
        const asignaciones = tecnicosSeleccionados.map(
          tecnicoId => ({
            siga_id: sigaEditando,
            tecnico_id: tecnicoId,
            activo: true
          })
        );

        await supabase
        .from("siga_tecnicos")
        .insert(asignaciones);
      }

      if (
        sigaActual.grupo_gestion_id !==
        (
          formData.grupo_gestion_id
            ? Number(formData.grupo_gestion_id)
            : null
        )
      ){
        const grupoAnterior = gruposGestion.find(
          g =>
            g.id ===
            sigaActual.grupo_gestion_id
        );
        const grupoNuevo = gruposGestion.find(
          g =>
            g.id ===
            Number(formData.grupo_gestion_id)
        );

        const {error: historialGrupoError} = await supabase
        .from("historial_siga")
        .insert([
          {
            siga_id: sigaEditando,
            usuario_id: user.id,
            tipo_movimiento:
              "Cambio Grupo Gestión",
            comentario:
              `Grupo cambiado de ${
                grupoAnterior?.nombre || "-"
              } a ${
                grupoNuevo?.nombre || "-"
              }`
          }
        ]);

        if (historialGrupoError) {
          console.error(
          historialGrupoError
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
            tecnico_id: tecnicosSeleccionados.length > 0 ? tecnicosSeleccionados[0] : null,
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
              `Creación del reporte SIGA ${formData.numero_siga}`
          }
        ]);

      if (historialError) {
        console.error(
          "ERROR HISTORIAL SIGA: ",
          historialError
        );
      }

      if (tecnicosSeleccionados.length > 0) {
        const asignaciones =
          tecnicosSeleccionados.map(
            tecnicoId => ({
              siga_id: data.id,
              tecnico_id: tecnicoId,
              activo: true
            })
          );

        console.log(
          "ASIGNACIONES:",
          asignaciones
        );

        const {
          error: tecnicosError
        } = await supabase
          .from("siga_tecnicos")
          .insert(asignaciones);

        if (tecnicosError) {
          console.error(
            "ERROR TECNICOS:",
            tecnicosError
          );
        }
      }
    }

    console.log(
      "TECNICOS SELECCIONADOS:",
      tecnicosSeleccionados
    );    

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

    setTecnicosSeleccionados(
      siga.siga_tecnicos?.map(
        st => st.tecnico_id
      ) || []
    );
    setMostrarFormulario(true);
  }

  async function cargarHistorialSIGA(siga) {
    setSigaHistorial(siga);
    const { data } = await supabase
      .from("historial_siga")
      .select(`
        *,
        estados_siga!estado_nuevo(nombre),
        perfiles!usuario_id(nombre, correo)
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

  function calcularMetricasSIGA(
    historialSIGA,
    horasSLA
  ) {
    if (!historialSIGA?.length) {
      return {
        tiempoConsumidoHoras: 0,
        tiempoDiferidoHoras: 0,
        tiempoTotalHoras: 0,
        cumpleSLA: true
      };
    }

    const movimientos = [...historialSIGA]
      .sort(
        (a, b) =>
          new Date(a.fecha_movimiento)
          - new Date(b.fecha_movimiento)
      );
    let tiempoConsumido = 0;
    let tiempoDiferido = 0;

    let inicioActivo = null;
    let inicioDiferido = null;

    let finalizado = false;

    movimientos.forEach((mov) => {
      const fecha = new Date(
        mov.fecha_movimiento
      );
      switch (mov.tipo_movimiento) {
        case "Creación":
          inicioActivo = fecha;
          break;

        case "Inicio Diferido":
          if (inicioActivo) {
            tiempoConsumido +=
              fecha - inicioActivo;
            inicioActivo = null;
          }
          inicioDiferido = fecha;
          break;

        case "Fin Diferido":
          if (inicioDiferido) {
            tiempoDiferido +=
              fecha - inicioDiferido;
            inicioDiferido = null;
          }
          inicioActivo = fecha;
          break;

        case "Restablecimiento":

        case "Cierre":
          if (
            inicioActivo &&
            !finalizado
          ) {
            tiempoConsumido +=
              fecha - inicioActivo;
            inicioActivo = null;
          }

          finalizado = true;
          break;
        default:
          break;
      }
    });

    const tiempoConsumidoHoras =
      tiempoConsumido /
      (1000 * 60 * 60);
    const tiempoDiferidoHoras =
      tiempoDiferido /
      (1000 * 60 * 60);
    const tiempoTotalHoras =
      tiempoConsumidoHoras +
      tiempoDiferidoHoras;
    const cumpleSLA =
      tiempoConsumidoHoras <=
      horasSLA;

    return {
      tiempoConsumidoHoras,
      tiempoDiferidoHoras,
      tiempoTotalHoras,
      cumpleSLA
    };
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

  useEffect(() => {
    cargarSigas();
    cargarEstadosSIGA();
    cargarPrioridades();
    cargarGrupos();
    cargarTecnicos();
    cargarTiposServicio();
  }, []);

  const location = useLocation();

  useEffect(() => {
    if (
      location.state?.filtroDashboard
    ) {
      setFiltroDashboard(
        location.state.filtroDashboard
      );
    }
  }, [location]);

  const metricas =
    mostrarHistorial
      ? calcularMetricasSIGA(
          historialSIGA,
          sigaHistorial?.prioridades_siga?.horas_sla || 0
        ) 
      : null;

  return (
    <div>
      <h1>SIGA</h1>

      <button
        onClick={() => {
          setSigaEditando(null);
          setFormData(formularioVacio);
          setMostrarFormulario(true);
          setTecnicosSeleccionados([]);
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

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px"
        }}
      >

        <input
          placeholder="Buscar SIGA"
          value={filtroSIGA}
          onChange={(e) => setFiltroSIGA(e.target.value)}
        />

        <input
          placeholder="Buscar Linea"
          value={filtroLinea}
          onChange={(e) => setFiltroLinea(e.target.value)}
        />

        <input
          placeholder="Buscar Evento AGIL"
          value={filtroEvento}
          onChange={(e) => setFiltroEvento(e.target.value)}
        />

      </div>

      {
        filtroDashboard && (
          <div
            style={{
              backgroundColor: "#eef2ff",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "15px",
              textAlign: "center"
            }}
          >
            Mostrando filtro:
            <strong
              style = {{
                marginLeft: "5px",
                marginRight: "15px"
              }}
            > {filtroDashboard}
            </strong>

            <button
              onClick={() =>
                setFiltroDashboard("")
              }
            >
              Limpiar
            </button>
          </div>
        )
      }

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
          {sigas.filter((siga) => 
            String(siga.numero_siga || "")
              .toLowerCase().includes(filtroSIGA.toLowerCase())
          )
          .filter((siga) =>
            (siga.numero_linea || "")
              .toLowerCase().includes(filtroLinea.toLowerCase())
          )
          .filter((siga) =>
            (siga.evento_agil || "")
              .toLowerCase().includes(filtroEvento.toLowerCase())
          )
          .filter ((siga) => {
            if (
              filtroDashboard === "Vencidos"
            ){
              return (horasRestantesSIGA(siga.fecha_maxima_atencion) < 0 &&siga.estados_siga?.nombre !=="Cerrado");
            }
            if (
              filtroDashboard === "SIGAs En campo"
            ){
              return (
                siga.tecnico_id &&
                siga.estados_siga?.nombre !== "Cerrado" &&
                siga.estados_siga?.nombre !== "Abierto - Verificación"
              );
            }
            if (
              filtroDashboard === "SIGAs Por vencer"
            ){
              return (siga.fecha_maxima_atencion === "Por vencer");
            }
            if (
              filtroDashboard === "SIGAs Dentro SLA"
            ){
              return (
                siga.estados_siga?.nombre !== "Cerrado" &&
                siga.estados_siga?.nombre !== "Diferido" &&
                horasRestantesSIGA(
                  siga.fecha_maxima_atencion
                ) > 1
              );
            }
            return true;
          })

          .map((siga) => {
            const sla = obtenerSLASIGA(siga.fecha_maxima_atencion);
            return (
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
                  style={{color: sla.color, fontWeight: 600,}}>
                  {sla.texto}
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
            )
          })}
        </tbody>
      </table>

      {
        mostrarFormulario && (

          <div className="modal-overlay">
            <div className="modal-content">

              <div>
                <h3>
                  {sigaEditando
                    ? "Editar SIGA"
                    : "Nuevo SIGA"}
                </h3>

                {/* DATOS OPERATIVOS */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "15px",
                    marginBottom: "15px"
                  }}
                >

                  {/* SIGA */}
                  <input
                    type="text"
                    placeholder="Número SIGA"
                    value={formData.numero_siga || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numero_siga: e.target.value
                      })
                    }
                  />

                  {/* FECHA */}
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

                  {/* LÍNEA */}
                  <input
                    type="text"
                    placeholder="Número Línea"
                    value={formData.numero_linea || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numero_linea: e.target.value
                      })
                    }
                  />

                  {/* TÉCNICOS */}
                  <div style = {{ position: "relative", width: "100%" }}>
                    <button type="button" onClick={() => setMostrarTecnicos(!mostrarTecnicos)}
                    style={{
                        width: "100%",
                        padding: "8px",
                        cursor: "pointer"
                      }}
                    >
                      {tecnicosSeleccionados.length > 0
                        ? `👷 Técnicos (${tecnicosSeleccionados.length})`
                        : "👷 Sin técnicos asignados"
                      }
                    </button>

                    {/* CHIPS */}
                    {tecnicosSeleccionados.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                          marginTop: "8px"
                        }}
                      >
                        {tecnicos
                          .filter(t =>
                            tecnicosSeleccionados.includes(t.id)
                          )
                          .map(t => (
                            <span
                              key={t.id}
                              style={{
                                backgroundColor: "#dbeafe",
                                color: "#1e40af",
                                padding: "4px 8px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "500"
                              }}
                            >
                              {t.nombre}
                            </span>
                          ))
                        }
                      </div>
                    )}

                    {/* DESPLEGABLE */}
                    {mostrarTecnicos && (                  
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          marginTop: "5px",
                          background: "white",
                          width: "320px",
                          maxHeight: "220px",
                          overflowY: "auto",
                          zIndex: 1000,
                          border: "1px solid #ccc",
                          padding: "10px",
                          borderRadius: "8px",
                          boxShadow:
                              "0 2px 8px rgba(0,0,0,0.15)"
                        }}
                      >

                        {tecnicos.map((tecnico) => (

                          <label
                            key={tecnico.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              textAlign: "left",
                              fontSize: "14px",
                              cursor: "pointer",
                            }}
                          >

                            <input
                              type="checkbox"
                              checked={
                                tecnicosSeleccionados.includes(
                                  tecnico.id
                                )
                              }
                              onChange={(e) => {

                                if (e.target.checked) {
                                  setTecnicosSeleccionados([
                                    ...tecnicosSeleccionados,
                                    tecnico.id
                                  ]);
                                }
                                else {
                                  setTecnicosSeleccionados(
                                    tecnicosSeleccionados.filter(
                                      id => id !== tecnico.id
                                    )
                                  );
                                }
                              }}
                            />
                            {" "}
                            {tecnico.nombre}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* EVENTO AGIL */}
                <div
                  style={{
                    marginTop: "15px"
                  }}
                >
                  <input
                    type="text"
                    style={{width: "100%"}}
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

                {/* CLIENTE */}
                <div
                  style={{
                    marginTop: "15px"
                  }}
                >
                  <input
                    type="text"
                    style={{width: "100%"}}
                    placeholder="Cliente"
                    value={formData.cliente || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cliente: e.target.value
                      })
                    }
                  />
                </div>

                {/* ESTADO, TIPO SERVICIO + PRIORIDAD */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "15px",
                    marginTop: "15px"
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

                  <select
                    style={{width: "100%", marginTop: "10px"}}
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
                </div>

                <div style={{ marginTop: "15px" }}>
                  <textarea
                    rows={3}
                    style={{width: "100%", marginTop: "15px"}}
                    placeholder="Descripción"
                    value={formData.descripcion || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        descripcion: e.target.value
                      })
                    }                  
                  />
                </div>

                <div style={{ marginTop: "15px" }}>
                  <textarea
                    rows={3}
                    style={{width: "100%", marginTop: "15px"}}
                    placeholder="Observaciones"
                    value={formData.observaciones || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        observaciones: e.target.value
                      })
                    }                  
                  />                  
                </div>

                <br/>

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
                width: "700px",
                margin: "0 auto"
                }}
              >

                {historialSIGA.map((mov) => {

                  let color = "#2563eb";

                  if (mov.tipo_movimiento.includes("Creación")) {
                    color = "#22c55e"
                  }
                  if (mov.tipo_movimiento.includes("Cambio de estado")) {
                    color = "#3b82f6"
                  }
                  if (mov.tipo_movimiento.includes("Cierre")) {
                    color = "#64748b"
                  }
                  if (mov.tipo_movimiento.includes("Asignación Técnico")) {
                    color = "#06b6d4"
                  }
                  if (mov.tipo_movimiento.includes("Inicio Diferido")) {
                    color = "#f59e0b"
                  }
                  if (mov.tipo_movimiento.includes("Fin diferido")) {
                    color = "#84cc16"
                  }
                  if (mov.tipo_movimiento.includes("Restablecimiento")) {
                    color = "#0ea5e9"
                  }
                  if (mov.tipo_movimiento.includes("Cambio Grupo Gestión")) {
                    color = "#8b5cf6"
                  }              

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
                          {mov.comentario}
                          {mov.perfiles?.correo &&
                            ` por ${mov.perfiles.correo}`}
                        </div>

                      </div>
                    </div>
                  );
                })}

              </div>

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