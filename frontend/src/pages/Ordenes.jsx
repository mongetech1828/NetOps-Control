import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { useLocation } from "react-router-dom";
import HistorialOrdenModal from "../components/HistorialOrdenModal";
import * as XLSX from "xlsx";

function Ordenes() {

  const [ordenes, setOrdenes] = useState([]);
  const [actualizandoOrdenes, setActualizandoOrdenes] = useState(false);
  const [filtroOST, setFiltroOST] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtroLinea, setFiltroLinea] = useState("");
  const [filtroEvento, setFiltroEvento] = useState("");
  const [estados, setEstados] = useState([]);
  const [tiposServicio, setTiposServicio] = useState([]);
  const [transporte, setTransporte] = useState([]);
  const [ordenEditando, setOrdenEditando] = useState(null);
  const [historialOrden, setHistorialOrden] = useState([]);
  const [ordenHistorial, setOrdenHistorial] = useState(null); 
  const [mostrarHistorialOrden, setMostrarHistorialOrden] = useState(false);
  const [filtroDashboard, setFiltroDashboard] = useState("");
  const [tecnicos, setTecnicos] = useState([]);
  const [
    tecnicosSeleccionados,
    setTecnicosSeleccionados
  ] = useState([]);
  const [mostrarTecnicos, setMostrarTecnicos] = useState(false);  
  const formularioVacio ={
    tipo_registro: "OST",
    numero_ost: "",
    numero_linea: "",
    cliente: "",
    evento_agil: "",
    tipo_servicio_id: "",
    transporte_id: "",
    estado_id: "",
    fecha_recepcion: "",
    observaciones: "",
    ivc: "",
    uc: "",
    fo: "",
    crc: ""
  };
  const [formData, setFormData] = useState(formularioVacio);
  const prioridadCalculada = calcularPrioridad();

  useEffect(() => {
    cargarOrdenes();
    cargarEstados();
    cargarTiposServicio();
    cargarTransporte();
    cargarTecnicos();
  }, []);

  // Función para formatear la fecha en formato YYYY-MM-DD
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

  // Función para formatear la fecha y hora en formato YYYY-MM-DD HH:MM:SS
  function formatearFechaHoraDB(fecha) {

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    const horas = String(
      fecha.getHours()
    ).padStart(2, "0");
    const minutos = String(
      fecha.getMinutes()
    ).padStart(2, "0");
    const segundos = String(
      fecha.getSeconds()
    ).padStart(2, "0");

    return `${anio}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
  }

  function crearFechaLocal(fecha) {
    const fechaISO = fecha instanceof Date
      ? formatearFechaDB(fecha)
      : String(fecha || "").slice(0, 10);
    const [anio, mes, dia] = fechaISO.split("-").map(Number);

    if (!anio || !mes || !dia) return null;

    const resultado = new Date(anio, mes - 1, dia);
    if (
      resultado.getFullYear() !== anio ||
      resultado.getMonth() !== mes - 1 ||
      resultado.getDate() !== dia
    ) {
      return null;
    }

    return resultado;
  }

  async function notificarGuardadoParcial(mensaje) {
    await cargarOrdenes();
    setMostrarFormulario(false);
    setFormData(formularioVacio);
    setOrdenEditando(null);
    setTecnicosSeleccionados([]);
    alert(mensaje);
  }

  // Función para guardar una orden (crear o actualizar)
  async function guardarOrden() {

    if (!formData.numero_ost) {alert("Debe indicar el número OST");
      return;
    }
    if (!/^\d{8}$/.test(formData.numero_ost)) {
      alert("El número de OST debe contener exactamente 8 dígitos.");
      return;
    }
    if (!/^\d{8}$/.test(formData.numero_linea)) {
      alert("El número de LINEA debe contener exactamente 8 dígitos.");
      return;
    }
    if (!formData.cliente.trim()) {
      alert("Debe indicar el Cliente");
      return;
    }
    if (!formData.tipo_servicio_id) {alert("Debe indicar el Tipo de Servicio");
      return;
    }
    if (!formData.transporte_id) {alert("Debe indicar el trasnporte");
      return;
    }
    if (!formData.estado_id) {alert("Debe indicar el estado");
      return;
    }
    const { data: ordenesCoincidentes, error: errorConsultaOST } = await supabase
      .from("ordenes")
      .select("id")
      .eq("numero_ost", formData.numero_ost);

    if (errorConsultaOST) {
      console.error("ERROR VALIDANDO OST:", errorConsultaOST);
      alert("No fue posible verificar si el número OST ya existe.");
      return;
    }
    if (ordenesCoincidentes.some(({ id }) => String(id) !== String(ordenEditando))) {
      alert("La OST ya existe. Utilice Editar o Reingresar.");
      return;
    }

    let fechaMaxima = null;
    if (!ordenEditando) {
      if (!formData.fecha_recepcion) {
        alert("Debe indicar la fecha de recepción.");
        return;
      }
      fechaMaxima = sumarDiasHabiles(formData.fecha_recepcion, 4);
      if (!fechaMaxima) {
        alert("La fecha de recepción no es válida.");
        return;
      }
    }

    const {
      data: { user },
      error: errorUsuario
    } = await supabase.auth.getUser();
    if (errorUsuario || !user) {
      console.error("ERROR OBTENIENDO USUARIO PARA HISTORIAL:", errorUsuario);
      alert("No se pudo identificar al usuario para guardar el historial.");
      return;
    }

    if (ordenEditando) {
      const { data:ordenActual, error: errorOrdenActual } = await supabase
        .from("ordenes")
        .select("*")
        .eq("id", ordenEditando)
        .single();

      if (errorOrdenActual || !ordenActual) {
        console.error("ERROR CONSULTANDO ORDEN PARA EDITAR:", errorOrdenActual);
        alert("No se encontró la orden que intenta actualizar.");
        return;
      }

      const { error } = await supabase
        .from("ordenes")
        .update({
          numero_ost: formData.numero_ost,
          numero_linea: formData.numero_linea,
          evento_agil: formData.evento_agil,
          cliente: formData.cliente.trim(),
          tipo_servicio_id: formData.tipo_servicio_id,
          transporte_id: formData.transporte_id,
          estado_id: formData.estado_id,
          observaciones: formData.observaciones,
          ivc: formData.ivc,
          uc: formData.uc,
          fo: formData.fo,
          crc: formData.crc,
          prioridad_calculada: prioridadCalculada.prioridad,
          puntaje_prioridad: prioridadCalculada.puntaje
        })
        .eq("id", ordenEditando);

      if (error) {
        console.error("ERROR ACTUALIZANDO ORDEN:", error);
        alert("No se pudo actualizar la orden.");
        return;
      }

      const { data: tecnicosActuales, error: errorTecnicosActuales } = await supabase
        .from("orden_tecnicos")
        .select("tecnico_id")
        .eq("orden_id", ordenEditando);

      if (errorTecnicosActuales) {
        console.error("ERROR CONSULTANDO TÉCNICOS DE LA ORDEN:", errorTecnicosActuales);
        await notificarGuardadoParcial("La orden se actualizó, pero no se pudieron consultar sus técnicos.");
        return;
      }

      const idsActuales = tecnicosActuales.map(({ tecnico_id }) => Number(tecnico_id));
      const idsSeleccionados = tecnicosSeleccionados.map(Number);
      const agregados = idsSeleccionados.filter(id => !idsActuales.includes(id));
      const removidos = idsActuales.filter(id => !idsSeleccionados.includes(id));

      if (agregados.length > 0) {
        const asignaciones = agregados.map(tecnicoId => ({
          orden_id: ordenEditando,
          tecnico_id: tecnicoId,
          activo: true
        }));
        const { error: errorAgregarTecnicos } = await supabase
          .from("orden_tecnicos")
          .insert(asignaciones);

        if (errorAgregarTecnicos) {
          console.error("ERROR ASIGNANDO TÉCNICOS A LA ORDEN:", errorAgregarTecnicos);
          await notificarGuardadoParcial("La orden se actualizó, pero no se pudieron guardar los técnicos nuevos.");
          return;
        }
      }

      if (removidos.length > 0) {
        const { error: errorRetirarTecnicos } = await supabase
          .from("orden_tecnicos")
          .delete()
          .eq("orden_id", ordenEditando)
          .in("tecnico_id", removidos);

        if (errorRetirarTecnicos) {
          console.error("ERROR RETIRANDO TÉCNICOS DE LA ORDEN:", errorRetirarTecnicos);
          await notificarGuardadoParcial("La orden se actualizó, pero no se pudieron retirar algunos técnicos.");
          return;
        }
      }

      const idsTecnicosModificados = [...agregados, ...removidos];
      const movimientos = [];
      if (ordenActual.estado_id !== Number(formData.estado_id)) {
        const estadoAnterior = estados.find(estado => estado.id === Number(ordenActual.estado_id));
        const estadoNuevo = estados.find(estado => estado.id === Number(formData.estado_id));
        movimientos.push({
          orden_id: ordenEditando,
          usuario_id: user.id,
          estado_anterior: ordenActual.estado_id,
          estado_nuevo: Number(formData.estado_id),
          comentario: `Cambio de estado de "${estadoAnterior?.nombre || ordenActual.estado_id}" a "${estadoNuevo?.nombre || formData.estado_id}" por el usuario ${user.email}`
        });
      }

      if (idsTecnicosModificados.length > 0) {
        const { data: tecnicosModificados, error: errorNombresTecnicos } = await supabase
          .from("tecnicos")
          .select("id, nombre")
          .in("id", idsTecnicosModificados);

        if (errorNombresTecnicos) {
          console.error("ERROR CONSULTANDO NOMBRES DE TÉCNICOS:", errorNombresTecnicos);
          await notificarGuardadoParcial("La orden y sus técnicos se actualizaron, pero no se pudo completar el historial.");
          return;
        }

        const nombresPorId = new Map(
          tecnicosModificados.map(({ id, nombre }) => [Number(id), nombre])
        );
        if (agregados.length > 0) {
          movimientos.push({
            orden_id: ordenEditando,
            usuario_id: user.id,
            comentario: `Técnico(s) asignado(s): ${agregados.map(id => nombresPorId.get(id) || id).join(", ")} por el usuario ${user.email}`
          });
        }
        if (removidos.length > 0) {
          movimientos.push({
            orden_id: ordenEditando,
            usuario_id: user.id,
            comentario: `Técnico(s) removido(s): ${removidos.map(id => nombresPorId.get(id) || id).join(", ")} por el usuario ${user.email}`
          });
        }
      }

      if (movimientos.length > 0) {
        const { error: errorHistorial } = await supabase
          .from("historial_movimientos")
          .insert(movimientos);

        if (errorHistorial) {
          console.error("ERROR GUARDANDO HISTORIAL DE LA ORDEN:", errorHistorial);
          await notificarGuardadoParcial("La orden y sus técnicos se actualizaron, pero no se pudo guardar todo el historial.");
          return;
        }
      }

      } else {

        // Crear nueva orden
        const { data, error } = await supabase
          .from("ordenes")
          .insert([
            {
              tipo_registro: formData.tipo_registro,
              numero_ost: formData.numero_ost,
              numero_linea: formData.numero_linea,
              evento_agil: formData.evento_agil,
              cliente: formData.cliente.trim(),
              tipo_servicio_id: formData.tipo_servicio_id,
              transporte_id: formData.transporte_id,
              estado_id: formData.estado_id,
              observaciones: formData.observaciones,
              fecha_recepcion: formData.fecha_recepcion,
              fecha_maxima_atencion: formatearFechaDB(fechaMaxima),
              ivc: formData.ivc,
              uc: formData.uc,
              fo: formData.fo,
              crc: formData.crc,
              prioridad_calculada: prioridadCalculada.prioridad,
              puntaje_prioridad: prioridadCalculada.puntaje
            }
          ])
          .select()
          .single();

        if (error || !data) {
          console.error("ERROR CREANDO ORDEN:", error);
          alert("No se pudo crear la orden.");
          return;
        }

        const { error: errorHistorialCreacion } = await supabase
            .from("historial_movimientos")
            .insert([
              {
                orden_id: data.id,
                usuario_id: user.id,
                estado_anterior : null,
                estado_nuevo: Number(formData.estado_id),
                comentario: `Creación de OST ${formData.numero_ost} por el usuario ${user.email}`
              }
            ]);

        if (errorHistorialCreacion) {
          console.error("ERROR GUARDANDO HISTORIAL DE CREACIÓN:", errorHistorialCreacion);
          await notificarGuardadoParcial("La orden se creó, pero no se pudo guardar su inicio en el historial.");
          return;
        }

        if (
          tecnicosSeleccionados.length > 0
        ) {
          const asignaciones =
            tecnicosSeleccionados.map(
              tecnicoId => ({
                orden_id: data.id,
                tecnico_id: tecnicoId,
                activo: true
              })
            );

          const { error: tecnicosError } = await supabase
            .from("orden_tecnicos")
            .insert(asignaciones);

          if (tecnicosError) {
            console.error("ERROR ASIGNANDO TÉCNICOS A LA ORDEN:", tecnicosError);
            await notificarGuardadoParcial("La orden se creó, pero no se pudieron guardar los técnicos asignados.");
            return;
          }

          const { data: tecnicosAsignados, error: errorConsultaTecnicos } = await supabase
              .from("tecnicos")
              .select("nombre")
              .in("id", tecnicosSeleccionados);

          if (errorConsultaTecnicos) {
            console.error("ERROR CONSULTANDO NOMBRES DE TÉCNICOS:", errorConsultaTecnicos);
            await notificarGuardadoParcial("La orden y sus técnicos se guardaron, pero no se pudieron registrar los técnicos en el historial.");
            return;
          }

            const nombresTecnicos = tecnicosAsignados
              ?.map(t => t.nombre)
              .join(", ");

            const { error: errorHistorialTecnicos } = await supabase
              .from("historial_movimientos")
              .insert([
                {
                  orden_id: data.id,
                  usuario_id: user.id,
                  comentario: `Técnico(s) asignado(s): ${nombresTecnicos} por el usuario ${user.email}`
                }
              ]);

            if (errorHistorialTecnicos) {
              console.error("ERROR GUARDANDO HISTORIAL DE TÉCNICOS:", errorHistorialTecnicos);
              await notificarGuardadoParcial("La orden y sus técnicos se guardaron, pero no se pudo registrar la asignación en el historial.");
              return;
            }
        }
        
      }

    await cargarOrdenes();
    setMostrarFormulario(false);  
    setFormData(formularioVacio);
    setOrdenEditando(null);
    setTecnicosSeleccionados([]);
  } 

  // Función para cargar las órdenes desde la base de datos
  async function cargarOrdenes() {

  const { data, error } =
    await supabase
      .from("ordenes")
      .select(`
        *,
        estado ( nombre ),
        tipo_servicio(nombre),
        transporte(nombre),
        orden_tecnicos(tecnico_id, tecnicos(id,nombre))
      `)
      .order("id", { ascending: false });

    if (error) {
      console.error("ERROR CARGANDO ÓRDENES:", error);
      alert("No se pudieron cargar las órdenes.");
      return;
    }

    setOrdenes(data);
  }

  async function actualizarOrdenes() {
    if (actualizandoOrdenes) return;

    setActualizandoOrdenes(true);
    try {
      await cargarOrdenes();
    } finally {
      setActualizandoOrdenes(false);
    }
  }

  // Función para editar una orden existente
  function editarOrden(orden) {

    setOrdenEditando(orden.id);

    setFormData({
      tipo_registro: orden.tipo_registro || "OST",
      numero_ost: orden.numero_ost || "",
      numero_linea: orden.numero_linea || "",
      evento_agil: orden.evento_agil || "",
      cliente: orden.cliente || "",
      tipo_servicio_id: orden.tipo_servicio_id || "",
      transporte_id: orden.transporte_id || "",
      observaciones: orden.observaciones || "",
      estado_id: orden.estado_id || "",
      fecha_recepcion: orden.fecha_recepcion?.split("T")[0] || "",
      ivc: orden.ivc || "",
      uc: orden.uc || "",
      fo: orden.fo || "",
      crc: orden.crc || ""
    });

    setTecnicosSeleccionados(
      orden.orden_tecnicos?.map(
        ot => ot.tecnico_id
      ) || []
    );
    setMostrarFormulario(true);
  }

  // Función para reingresar una orden
  async function reingresarOrden(orden) {
    const motivo = window.prompt(`Ingrese el motivo del reingreso OST ${orden.numero_ost}`);

    if (!motivo) {
      return;
    }

    const fechaRecepcion = new Date();
    const fechaMaxima = sumarDiasHabiles(fechaRecepcion,4);
    if (!fechaMaxima) {
      alert("No se pudo calcular la fecha máxima de atención.");
      return;
    }
    const confirmar = window.confirm(`¿Está seguro de reingresar la OST: ${orden.numero_ost}?`);

    if (!confirmar) {
      return;
    }

    const { error } = await supabase
      .from("ordenes")
      .update({
        fecha_recepcion: formatearFechaDB(fechaRecepcion),
        fecha_maxima_atencion: formatearFechaDB(fechaMaxima),
        cantidad_reingresos: (orden.cantidad_reingresos || 0) + 1,
        fecha_ultimo_reingreso: formatearFechaHoraDB(new Date()),
        motivo_reingreso: motivo
      })
    .eq("id", orden.id);

    if (error) {
      console.error("ERROR ACTUALIZANDO FECHAS DE REINGRESO:", error);
      alert("No se pudo reingresar la orden.");
      return;
    }

    const {
      data: { user },
      error: errorUsuario
    } = await supabase.auth.getUser();
    if (errorUsuario || !user) {
      console.error("ERROR OBTENIENDO USUARIO PARA HISTORIAL:", errorUsuario);
      alert("La orden se reingresó, pero no se pudo identificar al usuario para guardar el historial.");
      await cargarOrdenes();
      return;
    }

    const { error: errorHistorial } = await supabase
      .from("historial_movimientos")
      .insert({
          orden_id: orden.id,
          usuario_id: user.id,
          estado_anterior : orden.estado_id,
          estado_nuevo: orden.estado_id,
          comentario: `OST ${orden.numero_ost} reingresada. Motivo: ${motivo}. Reingreso #${(orden.cantidad_reingresos || 0) + 1}`        
        });

    if (errorHistorial) {
      console.error("ERROR GUARDANDO HISTORIAL DE REINGRESO:", errorHistorial);
      alert("La orden se reingresó, pero no se pudo guardar el movimiento en el historial.");
    }

    await cargarOrdenes();

  }

  // Función para ver el historial de movimientos de una orden
  async function verHistorial(orden) {

    const { data,error } = await supabase
      .from("historial_movimientos")
      .select("*")
      .eq("orden_id", orden.id)
      .order("fecha_movimiento", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setHistorialOrden(data);
    setOrdenHistorial(orden);
    setMostrarHistorialOrden(true);
  }

  // Función para cargar los estados desde la base de datos
  async function cargarEstados() {

    const { data } = await supabase
      .from("estado")
      .select("*")
      .order("nombre");

    setEstados(data || []);
  }

  // Función para cargar los tipos de servicio desde la base de datos
  async function cargarTiposServicio() {

    const { data } = await supabase
      .from("tipo_servicio")
      .select("*")
      .order("nombre");

    setTiposServicio(data || []);

  }

  // Función para cargar el transporte desde la base de datos
  async function cargarTransporte() {

    const { data } = await supabase
      .from("transporte")
      .select("*")
      .order("nombre");

    setTransporte(data || []);

  }

  // Función para cargar los técnicos desde la base de datos
  async function cargarTecnicos() {
    const { data } =
      await supabase
        .from("tecnicos")
        .select("*")
        .order("nombre");

    setTecnicos(data || []);
  }

  // Función para sumar días hábiles a una fecha
  function sumarDiasHabiles(fecha, diasHabiles) {
    const resultado = crearFechaLocal(fecha);
    if (!resultado) return null;

    let diasAgregados = 0;

    while (diasAgregados < diasHabiles) {
      resultado.setDate(resultado.getDate() + 1);
      // Simular días hábiles (omitir fines de semana)
      const diasSemana = resultado.getDay();
      if (diasSemana !== 0 && diasSemana !== 6) {
        diasAgregados++;
      }
    }

    return resultado;
  }

  // Función para calcular los días restantes hasta la fecha máxima de atención
  function diasRestantes(fechaMaxima) {
    const fecha = crearFechaLocal(fechaMaxima);
    if (!fecha) return null;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Math.round((fecha - hoy) / (1000 * 60 * 60 * 24));
  }

  // Función para obtener el puntaje según el nivel
  function obtenerPuntaje(
    nivel
  ) {
    switch (nivel) {
      case "ALTO":
        return 3;
      case "MEDIO":
        return 2;
      case "BAJO":
        return 1;
      default:
        return 0;
    }
  }

  // Función para calcular la prioridad y el puntaje total
  function calcularPrioridad() {
    const puntaje =
      (obtenerPuntaje(formData.ivc) * 0.40) +
      (obtenerPuntaje(formData.uc) * 0.30) +
      (obtenerPuntaje(formData.fo) * 0.15) +
      (obtenerPuntaje(formData.crc) * 0.15);
    let prioridad = "BAJA";
    if (puntaje >= 2.5) {
      prioridad = "ALTA";
    }
    else if (puntaje >= 1.5) {
      prioridad = "MEDIA";
    }

    return {
      prioridad,
      puntaje:
        Number(
          puntaje.toFixed(2)
        )
    };
  }

  // Función para obtener el texto y color según la prioridad
  function estadoPrioridad(
    prioridad
  ) {
    if (prioridad === "ALTA") {
      return {
        texto: "🔴 Alta",
        color: "#dc2626"
      };
    }
    if (prioridad === "MEDIA") {
      return {
        texto: "🟡 Media",
        color: "#eab308"
      };
    }
    return {
      texto: "🟢 Baja",
      color: "#16a34a"
    };
  }

  function obtenerOrdenesFiltradas() {
    return ordenes
      .filter((orden) =>
        String(orden.numero_ost || "")
          .toLowerCase()
          .includes(filtroOST.toLowerCase())
      )
      .filter((orden) =>
        String(orden.numero_linea || "")
          .toLowerCase()
          .includes(filtroLinea.toLowerCase())
      )
      .filter((orden) =>
        String(orden.evento_agil || "")
          .toLowerCase()
          .includes(filtroEvento.toLowerCase())
      )
      .filter((orden) => {
        if (filtroDashboard === "Vencidas") {
          return diasRestantes(orden.fecha_maxima_atencion) < 0;
        }
        if (filtroDashboard === "Dentro SLA") {
          return diasRestantes(orden.fecha_maxima_atencion) > 2;
        }
        if (filtroDashboard === "En Campo") {
          return orden.estado?.nombre === "En campo";
        }
        if (filtroDashboard === "Reingresadas") {
          return orden.cantidad_reingresos > 0;
        }
        if (filtroDashboard === "Por vencer") {
          const dias = diasRestantes(orden.fecha_maxima_atencion);
          return dias >= 1 && dias <= 2;
        }
        if (filtroDashboard === "Vencen hoy") {
          return diasRestantes(orden.fecha_maxima_atencion) === 0;
        }
        return true;
      });
  }

  // Función para exportar los datos a un archivo Excel
  function exportarExcel() {

    const ordenesExportadas = obtenerOrdenesFiltradas();
    if (ordenesExportadas.length === 0) {
      alert("No hay órdenes que coincidan con los filtros aplicados.");
      return;
    }

    const datos = ordenesExportadas.map(
      (orden) => ({

        OST: orden.numero_ost,        
        Linea: orden.numero_linea,
        Evento_agil: orden.evento_agil,
        Cliente: orden.cliente,
        Servicio: orden.tipo_servicio?.nombre,
        Transporte: orden.transporte?.nombre,
        Estado: orden.estado?.nombre,
        Dias: diasRestantes(orden.fecha_maxima_atencion),
        Tecnicos:
          orden.orden_tecnicos
            ?.map(
              (t) =>
                t.tecnicos?.nombre
            )
            .join(", "),
        Prioridad:
          orden.prioridad_calculada,
        Puntaje:
          orden.puntaje_prioridad,
        Reingresos: orden.cantidad_reingresos
      })
    );

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    const fecha = new Date()
      .toISOString()
      .slice(0,10)
      .replaceAll("-","");

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Ordenes"
    );

    XLSX.writeFile(
      wb,
      `Ordenes_${fecha}.xlsx`
    );
  }

  // Obtener el estado de la ubicación actual
  const location = useLocation();

  //
  useEffect(() => {
    if (
      location.state?.filtroDashboard
    ) {
      setFiltroDashboard(
        location.state.filtroDashboard
      );
    }
  }, [location]);

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
            Entrega Servicios Empresariales
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
            onClick={() => setMostrarFormulario(true)}
          >
            Nueva Orden
          </button>
        </div>

        {/* Formulario de creación/edición de ordenes */}
        {
          mostrarFormulario && (
            <div className="modal-overlay">
              <div className="modal-content">

                <div>
                  <h3
                    style={{
                      marginBottom: "10px"
                    }}
                  >
                    {ordenEditando
                      ? "Editar Orden"
                      : "Nueva Orden"}
                  </h3>

                  <div
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "8px 15px",
                      marginBottom: "10px"
                    }}
                  >
                    <h4
                      style={{
                        marginTop: "0",
                        marginBottom: "8px",
                        textAlign: "center"
                      }}
                      >Clasificación de Prioridad</h4>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr",
                        gap: "15px"
                      }}
                    >
                      <div>
                        {/* IVC */}
                        <div>
                          <strong
                            title= "Impacto y Valor Comercal"
                            style= {{ cursor: "help", textDecoration: "underline" }}
                          >
                            IVC: 
                          </strong>

                          <label
                            style={{ marginRight: "20px" }}
                          >
                            <input
                              type="radio"
                              name="ivc"
                              value="ALTO"
                              checked={formData.ivc === "ALTO"}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  ivc: e.target.value
                                })
                              }
                            />
                            Alto
                          </label>

                          <label
                            style={{ marginRight: "20px" }}
                          >
                            <input
                              type="radio"
                              name="ivc"
                              value="MEDIO"
                              checked={formData.ivc === "MEDIO"}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  ivc: e.target.value
                                })
                              } 
                            />
                            Medio
                          </label>

                          <label
                            style={{ marginRight: "20px" }}
                          >
                            <input
                              type="radio"
                              name="ivc"
                              value="BAJO"
                              checked={formData.ivc === "BAJO"}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  ivc: e.target.value
                                })
                              }
                            />
                            Bajo
                          </label>
                        </div>

                        {/* UC */}
                        <div>
                          <strong
                            title="Urgencia Comercial"
                            style={{ cursor: "help", textDecoration: "underline" }}
                          >
                            UC: 
                          </strong>

                          <label
                            style={{ marginRight: "20px" }}
                          >
                            <input
                              type="radio"
                              name="uc"
                              value="ALTO"
                              checked={formData.uc === "ALTO"}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  uc: e.target.value
                                })
                              }
                            />
                            Alto
                          </label>

                          <label
                            style={{ marginRight: "20px" }}
                          >
                            <input
                              type="radio"
                              name="uc"
                              value="MEDIO"
                              checked={formData.uc === "MEDIO"}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  uc: e.target.value
                                })
                              } 
                            />
                            Medio
                          </label>

                          <label
                            style={{ marginRight: "20px" }}
                          >
                            <input
                              type="radio"
                              name="uc"
                              value="BAJO"
                              checked={formData.uc === "BAJO"}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  uc: e.target.value
                                })
                              }
                            />
                            Bajo
                          </label>
                        </div>

                        {/* FO */}
                        <div>
                          <strong
                            title="Factibilidad Operativa"
                            style={{ cursor: "help", textDecoration: "underline" }}
                          >
                            FO: 
                          </strong>

                          <label
                            style={{ marginRight: "20px" }}
                          >
                            <input
                              type="radio"
                              name="fo"
                              value="ALTO"
                              checked={formData.fo === "ALTO"}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  fo: e.target.value
                                })
                              }
                            />
                            Alto
                          </label>

                          <label
                            style={{ marginRight: "20px" }}
                          >
                            <input
                              type="radio"
                              name="fo"
                              value="MEDIO"
                              checked={formData.fo === "MEDIO"}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  fo: e.target.value
                                })
                              } 
                            />
                            Medio
                          </label>

                          <label
                            style={{ marginRight: "20px" }}
                          >
                            <input
                              type="radio"
                              name="fo"
                              value="BAJO"
                              checked={formData.fo === "BAJO"}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  fo: e.target.value
                                })
                              }
                            />
                            Bajo
                          </label>
                        </div>

                        {/* CRC */}
                        <div>
                          <strong
                            title="Compromiso Regulatorio y Contractual"
                            style={{ cursor: "help", textDecoration: "underline" }}
                          >
                            CRC: 
                          </strong>

                          <label
                            style={{ marginRight: "20px" }}
                          >
                            <input
                              type="radio"
                              name="crc"
                              value="ALTO"
                              checked={formData.crc === "ALTO"}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  crc: e.target.value
                                })
                              }
                            />
                            Alto
                          </label>

                          <label
                            style={{ marginRight: "20px" }}
                          >
                            <input
                              type="radio"
                              name="crc"
                              value="MEDIO"
                              checked={formData.crc === "MEDIO"}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  crc: e.target.value
                                })
                              } 
                            />
                            Medio
                          </label>

                          <label
                            style={{ marginRight: "20px" }}
                          >
                            <input
                              type="radio"
                              name="crc"
                              value="BAJO"
                              checked={formData.crc === "BAJO"}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  crc: e.target.value
                                })
                              }
                            />
                            Bajo
                          </label>
                        </div>

                      </div>

                      <div style={{ marginBottom: "10px" }}>
                        <strong>Prioridad:</strong>{" "}
                        <span
                          style={{
                            color:
                              prioridadCalculada.prioridad === "ALTA"
                                ? "#dc2626"
                                : prioridadCalculada.prioridad === "MEDIA"
                                ? "#f59e0b"
                                : "#16a34a",
                            fontWeight: "bold",
                            fontSize: "1.15rem"
                          }}
                        >
                          {prioridadCalculada.prioridad}
                        </span>

                        <br />
                        
                        <strong>Puntaje:</strong>{" "}
                        <span
                          style={{
                            fontWeight: "bold",
                            fontSize: "1.1rem"
                          }}
                        >
                          {prioridadCalculada.puntaje}
                        </span>

                      </div>

                    </div>
                  </div>

                  {/* DATOS OPERATIVOS */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "15px",
                      marginTop: "20px",
                    }}
                  >

                    {/* OST */}
                    <input
                      style={{
                        width: "90%",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db"
                      }}
                      type="text"
                      placeholder="Número OST"
                      value={formData.numero_ost || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          numero_ost: e.target.value.replace(/\D/g, "").slice(0, 8)
                        })
                      }
                    />

                    {/* FECHA */}
                    <input                    
                      type="date"
                      value={formData.fecha_recepcion || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fecha_recepcion: e.target.value})
                      }
                      disabled={ordenEditando !== null}
                      style={{width: "180px", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", backgroundColor: ordenEditando !== null ? "#f3f4f6" : "white" }}
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
                          numero_linea: e.target.value.replace(/\D/g, "").slice(0, 8)
                        })
                      }
                    />

                    {/* TÉCNICOS */}
                    <div style = {{position: "relative"}}>
                      <button
                        type="button"
                        onClick={() =>
                          setMostrarTecnicos(
                            !mostrarTecnicos
                          )
                        }
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
                          : "👷 Sin técnicos asignados"}

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
                            .filter((t) =>
                              tecnicosSeleccionados.includes(
                                t.id
                              )
                            )
                            .map((t) => (

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
                            ))}
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
                            borderRadius: "8px",
                            padding: "10px",
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
                                padding: "4px 0",
                                textAlign: "left",
                                fontSize: "14px",
                                cursor: "pointer"
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

                                  } else {

                                    setTecnicosSeleccionados(
                                      tecnicosSeleccionados.filter(
                                        (id) =>
                                          id !== tecnico.id
                                      )
                                    );
                                  }
                                }}
                              />

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
                          evento_agil: e.target.value.replace(/\D/g, "").slice(0, 6)
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
                      value={formData.cliente}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cliente: e.target.value})
                      }
                    />
                  </div>

                  {/* ESTADO, TIPO SERVICIO Y TRANSPORTE */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
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
                      value={formData.estado_id || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estado_id: e.target.value})
                        }
                    >
                    <option value="">
                      Seleccionar Estado
                    </option>
                      {estados.map((estado) => (
                        <option key={estado.id} value={estado.id}>
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
                          tipo_servicio_id:
                            e.target.value
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
                      value={formData.transporte_id || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          transporte_id:
                            e.target.value
                        })
                      }
                    >

                      <option value="">
                        Transporte
                      </option>

                      {transporte.map((item) => (

                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.nombre}
                        </option>

                      ))}
                    </select>
                    
                  </div>

                  {/* OBSERVACIONES */}
                  <div style={{ marginTop: "15px" }}>
                    <textarea
                      rows={4}
                      style={{width: "98%", marginTop: "15px", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db"}}
                      placeholder="Observaciones"
                      value={formData.observaciones}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          observaciones: e.target.value})
                      }
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      justifyContent: "center",
                      marginTop: "20px"
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
                      onClick={guardarOrden}
                    >
                      {ordenEditando
                      ? "Actualizar Orden"
                      : "Guardar Orden"}
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
                      onClick={() => {
                        setMostrarFormulario(false);
                        setOrdenEditando(null);
                        setFormData(formularioVacio);
                        setTecnicosSeleccionados([]);
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        <hr />

        {/* Tabla de órdenes */}
        <h2>Órdenes Registradas</h2>

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
            placeholder="Buscar OST"
            value={filtroOST}
            onChange={(e) => setFiltroOST(e.target.value)}
          />

          <input
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db"
            }}
            placeholder="Buscar Línea"
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

          <button 
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              cursor: "pointer"
            }}
            onClick={exportarExcel}>
              📊 Exportar Excel
          </button>

          <button
            type="button"
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              cursor: actualizandoOrdenes ? "wait" : "pointer"
            }}
            onClick={actualizarOrdenes}
            disabled={actualizandoOrdenes}
            title="Actualizar órdenes"
          >
            {actualizandoOrdenes ? "Actualizando..." : "↻ Actualizar"}
          </button>

        </div>

        {/* Mostrar el filtro activo si existe */}
        {
          filtroDashboard && (
            <div
              style={{
                backgroundColor: "#eef2ff",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "15px"
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

        {/* Tabla de órdenes */}
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            marginTop: "20px"
          }}
        >
          <thead>
            <tr>
              <th>OST</th>
              <th>Línea</th>
              <th>Evento AGIL</th>
              <th>Cliente</th>
              <th>Servicio</th>
              <th>Transporte</th>
              <th>Estado</th>
              <th>Cumplimiento</th>
              <th>Prioridad</th>
              <th>Reing.</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {obtenerOrdenesFiltradas().map((orden) => {
              const prioridad = estadoPrioridad(orden.prioridad_calculada);
              return (
                <tr key={orden.id}>
                  <td>{orden.numero_ost}</td>
                  <td>{orden.numero_linea}</td>
                  <td>{orden.evento_agil}</td>
                  <td>{orden.cliente}</td>
                  <td>{orden.tipo_servicio?.nombre || "-"}</td>
                  <td>{orden.transporte?.nombre || "-"}</td>
                  <td>{orden.estado?.nombre}</td>
                  <td>{diasRestantes(orden.fecha_maxima_atencion)}</td>
                  <td
                    style={{
                      color: prioridad.color,
                      fontWeight: "bold"
                    }}
                  >
                    {prioridad.texto}
                  </td>
                  <td>{orden.cantidad_reingresos}</td>
                  <td>
                    <div style={{
                      display: "flex",
                      gap: "4px",
                      justifyContent: "center"
                    }}>
                      <button
                        onClick={() => editarOrden(orden)}
                        >
                          Editar
                      </button>
                      <button
                        onClick={() => reingresarOrden(orden)}
                        >
                          Reingresar
                      </button>
                      <button
                        variant="outline"
                        size="sm"
                        onClick={() => verHistorial(orden)}
                        >
                          Historial
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table> 
        
        {/* Modal de historial de órdenes */}
        <HistorialOrdenModal
          visible={mostrarHistorialOrden}
          ordenHistorial={ordenHistorial}
          historialOrden={historialOrden}
          onClose={() =>
            setMostrarHistorialOrden(false)
          }
        />

      </div>
    </div>
  );

}

export default Ordenes;