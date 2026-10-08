import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../services/supabase";
import HistorialSIGAModal from "../components/HistorialSIGAModal";

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
  const [tecnicosSeleccionados, setTecnicosSeleccionados] = useState([]);
  const [historialSIGA, setHistorialSIGA] = useState([]);
  const [sigaHistorial, setSigaHistorial] = useState(null);
  const [mostrarHistorialSIGA, setMostrarHistorialSIGA] = useState(false);
  /*const [mostrarHistorial, setMostrarHistorial] = useState(false);*/
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [sigaEditando, setSigaEditando] = useState(null);
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
    setMostrarHistorialSIGA(true);
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

  useEffect(() => {
    console.log(
      "mostrarHistorialSIGA:",
      mostrarHistorialSIGA
    );

  }, [mostrarHistorialSIGA]);

  /*const metricas =
    mostrarHistorial
      ? calcularMetricasSIGA(
          historialSIGA,
          sigaHistorial?.prioridades_siga?.horas_sla || 0
        ) 
      : null;*/

  return (

    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
      }}
    >

      <div>

        <div
          style={{
            position: "relative",
            marginBottom: "30px"
          }}
        >

          <h1
            style={{
              textAlign: "center",
              margin: 0
            }}
          >
            SIGAs
          </h1>

          <button
            style={{
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "5px",
                  cursor: "pointer"}}
            onClick={() => {
              setSigaEditando(null);
              setFormData(formularioVacio);
              setMostrarFormulario(true);
              setTecnicosSeleccionados([]);
            }}        
          >
            Nuevo SIGA
          </button>

        </div>

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
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db"
            }}
            placeholder="Buscar SIGA"
            value={filtroSIGA}
            onChange={(e) => setFiltroSIGA(e.target.value)}
          />

          <input
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db"
            }}
            placeholder="Buscar Linea"
            value={filtroLinea}
            onChange={(e) => setFiltroLinea(e.target.value)}
          />

          <input
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db"
            }}
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
                  <div style={{
                      display: "flex",
                      gap: "4px",
                      justifyContent: "center"
                    }}>
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
                  </div>
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
                      style={{
                        width: "90%",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db"
                      }}
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
                      style={{width: "180px", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", backgroundColor: sigaEditando !== null ? "#f3f4f6" : "white" }}
                    />

                    {/* LÍNEA */}
                    <input
                      style={{
                        width: "90%",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db"
                      }}
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
                    <div style = {{ position: "relative" }}>
                      <button type="button" onClick={() => setMostrarTecnicos(!mostrarTecnicos)}
                      style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
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
                      style={{
                        width: "98%",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db"
                      }}
                      type="text"
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
                      style={{
                        width: "98%",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db"
                      }}
                      type="text"
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
                      gridTemplateColumns: "1fr 1fr",
                      gap: "15px",
                      marginTop: "15px"
                    }}
                  >

                    <select
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db"
                      }}
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
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db"
                      }}
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
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db"
                      }}
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
                      style={{width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db"}}
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
                      style={{width: "98%", marginTop: "15px", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db"}}
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
                      style={{width: "98%", marginTop: "15px", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db"}}
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
                      style={{
                      backgroundColor: "#4CAF50",
                      color: "white",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                      onClick={guardarSIGA}>
                      Guardar SIGA
                    </button>

                    <button
                      style={{
                      backgroundColor: "#f44336",
                      color: "white",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
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

        <HistorialSIGAModal

          visible={mostrarHistorialSIGA}
          sigaHistorial={sigaHistorial}
          historialSIGA={historialSIGA}
          onClose={() =>
            setMostrarHistorialSIGA(false)
          }
        />
        
      </div>

    </div>
  );
}

export default SIGA;