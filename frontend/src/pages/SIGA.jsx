import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import HistorialSIGAModal from "../components/HistorialSIGAModal";
import * as XLSX from "xlsx";
import {
  calcularHorasRestantesSIGA,
  cargarMovimientosSIGA
} from "../utils/sigaSla";

function SIGA() {

  const [sigas, setSigas] = useState([]);
  const [actualizandoSigas, setActualizandoSigas] = useState(false);
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

  // Función para calcular la fecha máxima de atención según la fecha de recepción y las horas SLA
  function calcularFechaMaximaSIGA(fechaRecepcion,horasSLA) {
    const fecha = new Date(fechaRecepcion);
    const milisegundosSLA = horasSLA * 60 * 60 * 1000;

    return new Date(fecha.getTime() + milisegundosSLA);
  }

  // Función para cerrar el formulario de SIGA y resetear los datos
  function cerrarFormularioSIGA() {
    setMostrarFormulario(false);
    setFormData(formularioVacio);
    setTecnicosSeleccionados([]);
    setSigaEditando(null);
  }

  // Función para cargar los SIGAs desde la base de datos
  async function cargarSigas() {
    try {

      const response =
        await fetch("/api/sigas");

      const data =
        await response.json();

      const {
        data: movimientos,
        error: errorMovimientos
      } = await cargarMovimientosSIGA();

      if (errorMovimientos) {

        console.error(
          "ERROR CARGANDO MOVIMIENTOS PARA CALCULAR SLA:",
          errorMovimientos
        );

        alert(
          "No se pudieron calcular las horas de SLA de los SIGAs."
        );

        return;
      }

      const movimientosPorSiga =
        new Map();

      movimientos.forEach(
        movimiento => {

          const movimientosSiga =
            movimientosPorSiga.get(
              movimiento.siga_id
            ) || [];

          movimientosSiga.push(
            movimiento
          );

          movimientosPorSiga.set(
            movimiento.siga_id,
            movimientosSiga
          );

        }
      );

      const sigasProcesados =
        data.map(siga => ({
          ...siga,
          horas_restantes_sla:
            calcularHorasRestantesSIGA(
              siga.fecha_maxima_atencion,
              movimientosPorSiga.get(
                siga.id
              ),
              siga.estado
            )
        }));

      setSigas(sigasProcesados);

    } catch (error) {

      console.error(
        "ERROR CARGANDO SIGAS:",
        error
      );
    }
  }

  async function actualizarSigas() {
    if (actualizandoSigas) return;

    setActualizandoSigas(true);
    try {
      await cargarSigas();
    } finally {
      setActualizandoSigas(false);
    }
  }

  // Función para obtener el estado del SLA de un SIGA según la fecha máxima de atención
  function obtenerSLASIGA(horas, estado) {
    if (horas === null) {
      const mensaje = estado === "Cerrado"
        ? "⚪Sin registro de cierre"
        : estado === "Restablecimiento"
          ? "⚪Sin registro de restablecimiento"
          : estado === "Diferido"
            ? "⚪Sin registro de inicio diferido"
            : "⚪No disponible";
      return { texto: mensaje, color: "#6b7280" };
    }
    if (horas < 0) {
      return {texto: "⚫Vencido",color: "#dc2626",};}
    if (horas <= 1) {
      return {texto: "🟡Prox. vencer",color: "#eab308",};}
    return {texto: "🟢En tiempo",color: "#16a34a",};
  }

  // Funciones para cargar datos de estado, prioridad, grupo de gestión y tipo de servicio desde la base de datos
  async function cargarEstadosSIGA() {
    try {

      const response =
        await fetch("/api/estados-siga");

      const data =
        await response.json();

      setEstadosSIGA(data);

    } catch (error) {

      console.error(
        "ERROR CARGANDO ESTADOS SIGA:",
        error
      );
    }
  }

  async function cargarPrioridades() {
    try {

      const response =
        await fetch("/api/prioridades-siga");

      const data =
        await response.json();

      setPrioridadesSIGA(data);

    } catch (error) {

      console.error(
        "ERROR CARGANDO PRIORIDADES SIGA:",
        error
      );
    }
  }

  async function cargarGrupos() {
    try {

      const response =
        await fetch("/api/grupos-gestion");

      const data =
        await response.json();

      setGruposGestion(data);

    } catch (error) {

      console.error(
        "ERROR CARGANDO GRUPOS:",
        error
      );
    }
  }

  async function cargarTiposServicio() {
    try {

      const response =
        await fetch("/api/tipo-servicio");

      const data =
        await response.json();

      setTiposServicio(data);

    } catch (error) {

      console.error(
        "ERROR CARGANDO TIPOS DE SERVICIO:",
        error
      );
    }
  }

  // Función para cargar los técnicos desde la base de datos
  async function cargarTecnicos() {
    try {

      const response =
        await fetch("/api/tecnicos");

      const data =
        await response.json();

      setTecnicos(data);

    } catch (error) {

      console.error(
        "ERROR CARGANDO TECNICOS:",
        error
      );
    }
  }

  // Función para registrar los cambios de técnicos en el historial del SIGA
  async function registrarCambiosTecnicosSIGA(
    sigaId,
    agregados,
    removidos
  ) {

    if (
      agregados.length === 0 &&
      removidos.length === 0
    ) {
      return true;
    }

    const idsTecnicos = [
      ...new Set([
        ...agregados,
        ...removidos
      ])
    ];

    try {

      const usuarioActual =
        JSON.parse(
          localStorage.getItem("usuario")
        );

      const responseTecnicos =
        await fetch("/api/tecnicos");

      if (!responseTecnicos.ok) {

        console.error(
          "ERROR CONSULTANDO TÉCNICOS"
        );

        alert(
          "Los técnicos se actualizaron, pero no se pudieron obtener sus nombres para el historial."
        );

        return false;
      }

      const tecnicosCatalogo =
        await responseTecnicos.json();

      const nombresPorId = new Map(
        tecnicosCatalogo.map(
          tecnico => [
            Number(tecnico.id),
            tecnico.nombre
          ]
        )
      );

      const idsSinNombre =
        idsTecnicos.filter(
          id =>
            !nombresPorId.has(
              Number(id)
            )
        );

      if (idsSinNombre.length > 0) {

        console.error(
          "TÉCNICOS SIN NOMBRE PARA HISTORIAL:",
          idsSinNombre
        );

        alert(
          "Los técnicos se actualizaron, pero no se encontraron todos sus nombres para el historial."
        );

        return false;
      }

      const movimientos = [];

      if (agregados.length > 0) {

        const nombresAgregados =
          agregados
            .map(
              id =>
                nombresPorId.get(
                  Number(id)
                )
            )
            .join(", ");

        movimientos.push({
          siga_id: sigaId,
          tipo_movimiento:
            "Asignación Técnico",
          comentario:
            `Técnico(s) asignado(s): ${nombresAgregados} por ${usuarioActual.nombre}`
        });

      }

      if (removidos.length > 0) {

        const nombresRemovidos =
          removidos
            .map(
              id =>
                nombresPorId.get(
                  Number(id)
                )
            )
            .join(", ");

        movimientos.push({
          siga_id: sigaId,
          tipo_movimiento:
            "Asignación Técnico",
          comentario:
            `Técnico(s) removido(s): ${nombresRemovidos} por ${usuarioActual.nombre}`
        });

      }

      if (
        movimientos.length > 0 &&
        usuarioActual?.id
      ) {

        for (const movimiento of movimientos) {

          const responseHistorial =
            await fetch(
              "/api/historial-siga",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json"
                },
                body: JSON.stringify({
                  ...movimiento,
                  usuario_id:
                    usuarioActual.id
                })
              }
            );

          if (
            !responseHistorial.ok
          ) {

            console.error(
              "ERROR REGISTRANDO CAMBIO DE TÉCNICOS EN HISTORIAL SIGA"
            );

            alert(
              "Los técnicos se actualizaron, pero no se pudo guardar el cambio en el historial."
            );

            return false;
          }

        }

      }

      return true;

    } catch (error) {

      console.error(
        "ERROR REGISTRANDO HISTORIAL DE TÉCNICOS SIGA:",
        error
      );

      return false;

    }

  }

  // Función para guardar un SIGA, ya sea creando uno nuevo o actualizando uno existente
  async function guardarSIGA() {
    if (!formData.numero_siga) {alert("Debe indicar el número SIGA");
      return;
    }
    if (formData.numero_siga.length !== 10) {alert("El número SIGA debe contener exactamente 10 dígitos");
      return;
    }
    if (!formData.numero_linea) {alert("Debe indicar el número de línea");
      return;
    }
    if (formData.numero_linea.length !== 8) {alert("El número de LINEA debe contener exactamente 8 dígitos");
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

    const prioridadSeleccionada =
      prioridadesSIGA.find((p) => Number(p.id) === Number(formData.prioridad_id));
    if (!prioridadSeleccionada) {
      alert("No se encontró la prioridad seleccionada");
      return;
    }

    const fechaMaxima = calcularFechaMaximaSIGA(
      formData.fecha_recepcion,
      prioridadSeleccionada.horas_sla
    );

    const nivelCalculado =
      tecnicosSeleccionados.length > 0 ? "ST" : "GT";

    const responseSigas = await fetch("/api/sigas");

    if (!responseSigas.ok) {
      alert("No fue posible verificar si el número SIGA ya existe.");
      return;
    }

    const sigasExistentes = await responseSigas.json();

    const sigaExistente = sigasExistentes.find(
      s => s.numero_siga === formData.numero_siga.trim()
    );

    if (!sigaEditando && sigaExistente) {

      alert(
        "Ya existe un SIGA con ese número. Utilice Editar para modificarlo."
      );

      setFormData(formularioVacio);
      setTecnicosSeleccionados([]);

      return;
    }

    // Si estamos editando, verificamos que el SIGA exista
    if (sigaEditando){

      const sigaActual = sigas.find(s => s.id ===sigaEditando);

      if (!sigaActual) {
        alert("No se encontró el SIGA que intenta actualizar.");
        return;
      }

      const response = await fetch(`/api/sigas/${sigaEditando}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numero_linea: formData.numero_linea,
          evento_agil: formData.evento_agil,
          cliente: formData.cliente,
          tipo_servicio_id: formData.tipo_servicio_id
            ? parseInt(formData.tipo_servicio_id)
            : null,
          prioridad_id: formData.prioridad_id
            ? parseInt(formData.prioridad_id)
            : null,
          estado_siga_id: formData.estado_siga_id
            ? parseInt(formData.estado_siga_id)
            : null,
          grupo_gestion_id: formData.grupo_gestion_id
            ? parseInt(formData.grupo_gestion_id)
            : null,
          descripcion: formData.descripcion,
          observaciones: formData.observaciones,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error actualizando SIGA:", errorData);
        return;
      }

      const usuarioActual = JSON.parse(
        localStorage.getItem("usuario")
      );

      // Registrar cambios de estado en el historial si hubo un cambio
      if (
        Number(sigaActual.estado_siga_id) !==
        Number(formData.estado_siga_id)
      ){
        const estadoAnterior =
          estadosSIGA.find(
            e =>
              Number(e.id) ===
              Number(sigaActual.estado_siga_id)
          );
        const estadoNuevo =
          estadosSIGA.find(
            e =>
              Number(e.id) ===
              Number(formData.estado_siga_id)
            );

        const movimientos = [
            {
              siga_id: sigaEditando,
              usuario_id: usuarioActual?.id,
              tipo_movimiento: "Cambio Estado",
              estado_anterior: sigaActual.estado_siga_id,
              estado_nuevo: Number(formData.estado_siga_id),
              comentario:
                `Estado cambiado de ${
                  estadoAnterior?.nombre ||
                  sigaActual.estado ||
                  "Sin estado"
                } a ${
                  estadoNuevo?.nombre ||
                  "Estado desconocido"
                }`
            }
        ];

        // Registrar movimientos específicos según el estado nuevo
        if (estadoNuevo?.nombre === "Diferido") {
            movimientos.push({
              siga_id: sigaEditando,
              usuario_id: usuarioActual?.id,
              tipo_movimiento: "Inicio Diferido",
              comentario: "El reporte fue colocado en estado Diferido"
            });
        }

        // Registrar movimientos específicos según el estado anterior y nuevo
        if (
            estadoAnterior?.nombre === "Diferido" &&
            estadoNuevo?.nombre !== "Diferido"
        ) {
            movimientos.push({
              siga_id: sigaEditando,
              usuario_id: usuarioActual?.id,
              tipo_movimiento: "Fin Diferido",
              comentario: "El reporte salió del estado Diferido"
            });
        }

        if (estadoNuevo?.nombre === "Restablecimiento") {
            movimientos.push({
              siga_id: sigaEditando,
              usuario_id: usuarioActual?.id,
              tipo_movimiento: "Restablecimiento",
              comentario: "Servicio restablecido"
            });
        }

        if (estadoNuevo?.nombre === "Cerrado") {
            movimientos.push({
              siga_id: sigaEditando,
              usuario_id: usuarioActual?.id,
              tipo_movimiento: "Cierre",
              comentario: "Reporte cerrado"
            });
        }        

        if (
          movimientos.length > 0 &&
          usuarioActual?.id
        ) {

          for (const movimiento of movimientos) {

            const responseHistorial = await fetch(
              "/api/historial-siga",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  ...movimiento,
                  usuario_id: usuarioActual.id
                })
              }
            );

            if (!responseHistorial.ok) {

              console.error(
                "ERROR GUARDANDO HISTORIAL DE ESTADO SIGA"
              );

              alert(
                "El SIGA se actualizó, pero no se pudo guardar el historial."
              );

              return;
            }
          }

        }
      }

      // Registrar cambios de técnicos en el historial si hubo cambios
      const responseTecnicos = await fetch(
        `/api/siga-tecnicos/${sigaEditando}`
      );

      if (!responseTecnicos.ok) {
        alert("No se pudieron consultar los técnicos actuales del SIGA.");
        return;
      }

      const tecnicosActuales = await responseTecnicos.json();

      const idsTecnicosActuales = tecnicosActuales.map(
        ({ tecnico_id }) => Number(tecnico_id)
      );
      const idsTecnicosSeleccionados = tecnicosSeleccionados.map(Number);
      const agregados = tecnicosSeleccionados.filter(
        (id) => !idsTecnicosActuales.includes(Number(id))
      );
      const removidos = idsTecnicosActuales.filter(
        (id) => !idsTecnicosSeleccionados.includes(id)
      );

      // Insertar los técnicos seleccionados nuevamente
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

        const responseAsignacion = await fetch(
          `/api/siga-tecnicos/${sigaEditando}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tecnicos: tecnicosSeleccionados,
            }),
          }
        );

        if (!responseAsignacion.ok) {
          alert("No se pudieron actualizar los técnicos asignados.");
          return;
        }
      }

      // Registrar cambios de técnicos en el historial
      const historialTecnicosGuardado = await registrarCambiosTecnicosSIGA(
        sigaEditando,
        agregados,
        removidos
      );
      if (!historialTecnicosGuardado) {
        return;
      }

      // Registrar cambios de grupo de gestión en el historial si hubo un cambio
      if (
        Number(sigaActual.grupo_gestion_id) !==
        Number(
          formData.grupo_gestion_id
            ? formData.grupo_gestion_id
            : null
        )
      ) {

        const grupoAnterior =
          gruposGestion.find(
            g =>
              Number(g.id) ===
              Number(
                sigaActual.grupo_gestion_id
              )
          );

        const grupoNuevo =
          gruposGestion.find(
            g =>
              Number(g.id) ===
              Number(
                formData.grupo_gestion_id
              )
          );

        if (usuarioActual?.id) {

          const responseHistorial =
            await fetch(
              "/api/historial-siga",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json"
                },
                body: JSON.stringify({
                  siga_id: sigaEditando,
                  usuario_id:
                    usuarioActual.id,
                  tipo_movimiento:
                    "Cambio Grupo Gestión",
                  comentario:
                    `Grupo cambiado de ${
                      grupoAnterior?.nombre ||
                      "-"
                    } a ${
                      grupoNuevo?.nombre ||
                      "-"
                    }`
                })
              }
            );

          if (!responseHistorial.ok) {

            console.error(
              "ERROR HISTORIAL GRUPO SIGA"
            );

            alert(
              "El grupo se actualizó, pero no se pudo guardar el cambio en el historial."
            );

            return;
          }

        }

      }

    }
    else {

      // Si no estamos editando, creamos un nuevo SIGA
      const response = await fetch("/api/sigas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numero_siga: formData.numero_siga,
          numero_linea: formData.numero_linea,
          evento_agil: formData.evento_agil,
          cliente: formData.cliente,
          tipo_servicio_id: formData.tipo_servicio_id
            ? parseInt(formData.tipo_servicio_id)
            : null,
          prioridad_id: formData.prioridad_id
            ? parseInt(formData.prioridad_id)
            : null,
          estado_siga_id: formData.estado_siga_id
            ? parseInt(formData.estado_siga_id)
            : null,
          grupo_gestion_id: formData.grupo_gestion_id
            ? parseInt(formData.grupo_gestion_id)
            : null,
          nivel: nivelCalculado,
          fecha_recepcion: formData.fecha_recepcion,
          fecha_maxima_atencion: fechaMaxima
            .toLocaleString("sv-SE")
            .replace(" ", "T"),
          descripcion: formData.descripcion,
          observaciones: formData.observaciones,
          evento_agil: formData.evento_agil
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        console.error(
          "Error creando SIGA:",
          errorData
        );

        alert("No se pudo crear el SIGA.");
        return;
      }

      const data = await response.json();

      const usuarioActual = JSON.parse(
        localStorage.getItem("usuario")
      );

      if (usuarioActual?.id) {

        const responseHistorial =
          await fetch(
            "/api/historial-siga",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                siga_id: data.id,
                usuario_id: usuarioActual.id,
                estado_anterior: null,
                estado_nuevo:
                  Number(formData.estado_siga_id),
                tipo_movimiento:
                  "Creación",
                comentario:
                  `Creación del reporte SIGA ${formData.numero_siga}`
              })
            }
          );

        if (!responseHistorial.ok) {

          console.error(
            "ERROR HISTORIAL SIGA"
          );
          alert("El SIGA se creó, pero no se pudo registrar el historial de creación.");
        }
      }

      // Registrar los técnicos asignados al nuevo SIGA
      if (tecnicosSeleccionados.length > 0) {
        const asignaciones =
          tecnicosSeleccionados.map(
            tecnicoId => ({
              siga_id: data.id,
              tecnico_id: tecnicoId,
              activo: true
            })
          );

        const responseAsignacion = await fetch(
          `/api/siga-tecnicos/${data.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tecnicos: tecnicosSeleccionados,
            }),
          }
        );

        if (!responseAsignacion.ok) {

          const errorData =
            await responseAsignacion.json();

          console.error(
            "ERROR TECNICOS:",
            errorData
          );

          alert(
            "El SIGA se creó, pero no se pudieron guardar los técnicos asignados."
          );
        } else {

          const historialTecnicosGuardado =
            await registrarCambiosTecnicosSIGA(
              data.id,
              tecnicosSeleccionados,
              []
            );

          if (!historialTecnicosGuardado) {
            return;
          }

        }
      }
    }

    await cargarSigas();
    cerrarFormularioSIGA();
  }

  // Función para editar un SIGA, cargando sus datos en el formulario
  async function editarSIGA(siga) {

    setSigaEditando(siga.id);

    setFormData({
      numero_siga: siga.numero_siga || "",
      numero_linea: siga.numero_linea || "",
      evento_agil: siga.evento_agil || "",
      cliente: siga.cliente || "",
      tipo_servicio_id: siga.tipo_servicio_id || "",
      prioridad_id: siga.prioridad_id || "",
      estado_siga_id: siga.estado_siga_id || "",
      grupo_gestion_id: siga.grupo_gestion_id || "",
      tecnico_id: siga.tecnico_id || "",
      fecha_recepcion: siga.fecha_recepcion
        ? siga.fecha_recepcion.substring(0, 16)
        : "",
      descripcion: siga.descripcion || "",
      observaciones: siga.observaciones || ""
    });

    try {

      const response = await fetch(
        `/api/siga-tecnicos/${siga.id}`
      );

      if (response.ok) {

        const tecnicos = await response.json();

        setTecnicosSeleccionados(
          tecnicos.map(
            t => String(t.tecnico_id)
          )
        );

      } else {

        console.error(
          "Error obteniendo técnicos del SIGA"
        );

        setTecnicosSeleccionados([]);

      }

    } catch (error) {

      console.error(
        "Error cargando técnicos:",
        error
      );

      setTecnicosSeleccionados([]);

    }

    setMostrarFormulario(true);
  }

  // Función para cargar el historial de un SIGA y mostrarlo en un modal
  async function cargarHistorialSIGA(siga) {

    try {

      const response = await fetch(
        `/api/historial-siga/${siga.id}`
      );

      if (!response.ok) {

        alert(
          "No fue posible cargar el historial de este SIGA."
        );

        return;
      }

      const data = await response.json();

      setSigaHistorial(siga);
      setHistorialSIGA(data || []);
      setMostrarHistorialSIGA(true);

    } catch (error) {

      console.error(
        "ERROR CARGANDO HISTORIAL SIGA:",
        error
      );

      alert(
        "No fue posible cargar el historial de este SIGA."
      );

    }

  }

  function obtenerSigasFiltrados() {
    return sigas
      .filter((siga) =>
        String(siga.numero_siga || "")
          .toLowerCase()
          .includes(filtroSIGA.toLowerCase())
      )
      .filter((siga) =>
        String(siga.numero_linea || "")
          .toLowerCase()
          .includes(filtroLinea.toLowerCase())
      )
      .filter((siga) =>
        String(siga.evento_agil || "")
          .toLowerCase()
          .includes(filtroEvento.toLowerCase())
      )
      .filter((siga) => {
        if (filtroDashboard === "Vencidos") {
          return (
            siga.horas_restantes_sla < 0 &&
            siga.estado !== "Cerrado" &&
            siga.estado !== "Diferido"
          );
        }
        if (filtroDashboard === "SIGAs En campo") {
          return (
            siga.estado !== "Cerrado" &&
            siga.estado !== "Abierto-Verificación" &&
            siga.tecnicos?.length > 0
          );
        }
        if (filtroDashboard === "SIGAs Por vencer") {
          return (
            siga.estado !== "Cerrado" &&
            siga.estado !== "Diferido" &&
            siga.horas_restantes_sla <= 1 &&
            siga.horas_restantes_sla > 0
          );
        }
        if (filtroDashboard === "SIGAs Dentro SLA") {
          return (
            siga.estado !== "Cerrado" &&
            siga.estado !== "Diferido" &&
            siga.horas_restantes_sla > 1
          );
        }
        return true;
      });
  }

  // Función para exportar los SIGAs a un archivo Excel
  function exportarSIGAs() {
    const sigasExportados = obtenerSigasFiltrados();
    if (sigasExportados.length === 0) {
      alert("No hay SIGAs que coincidan con los filtros aplicados.");
      return;
    }

    const datos = sigasExportados.map(
      (siga) => ({
        SIGA: siga.numero_siga,
        Linea: siga.numero_linea,
        Evento_agil: siga.evento_agil,
        Cliente: siga.cliente,
        Servicio: siga.tipo_servicio,
        Prioridad: siga.prioridad,
        Estado: siga.estado,
        Grupo: siga.grupo_gestion,
        Tecnicos:
          siga.tecnicos
            ?.map(
              tecnico =>
                tecnico.nombre
            )
            .join(", ")
      })
    );

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb =XLSX.utils.book_new();
    const partesFecha = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Costa_Rica",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());
    const valoresFecha = Object.fromEntries(
      partesFecha.map(({ type, value }) => [type, value])
    );
    const fecha = `${valoresFecha.year}${valoresFecha.month}${valoresFecha.day}`;

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "SIGAs"
    );
    XLSX.writeFile(
      wb,
      `SIGAs_${fecha}.xlsx`
    );
  }

  // Cargar datos iniciales al montar el componente
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

  // Renderizado del componente
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
            Aseguramiento Servicios Empresariales
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

        <hr/>

        {/*Tabla SIGAs*/}
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

          <button 
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              cursor: "pointer"
            }}
            onClick={exportarSIGAs}>
              📊 Exportar Excel
          </button>

          <button
            type="button"
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              cursor: actualizandoSigas ? "wait" : "pointer"
            }}
            onClick={actualizarSigas}
            disabled={actualizandoSigas}
            title="Actualizar SIGAs"
          >
            {actualizandoSigas ? "Actualizando..." : "↻ Actualizar"}
          </button>

        </div>

        {/* Mostrar el filtro activo en un recuadro azul si existe */}
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

        {/* Tabla de SIGAs */}
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
              <th>Cumplimiento</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {obtenerSigasFiltrados().map((siga) => {
              const horasRestantes = siga.horas_restantes_sla;
              const sla = obtenerSLASIGA(
                horasRestantes,
                siga.estado
              );
              return (
              <tr key={siga.id}>
                <td>{siga.numero_siga}</td>
                <td>{siga.numero_linea}</td>
                <td>{siga.evento_agil}</td>
                <td>{siga.cliente}</td>
                <td>{siga.tipo_servicio || "-"}</td>
                <td>{siga.prioridad}</td>
                <td>{siga.estado}</td>
                <td>{siga.grupo_gestion}</td>
                <td>{horasRestantes === null ? "-" : Number(horasRestantes).toFixed(1)}</td>
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

        {/* Formulario SIGA */}
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
                          numero_siga: e.target.value.replace(/\D/g, "").slice(0, 10)
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
                          numero_linea: e.target.value.replace(/\D/g, "").slice(0, 8)
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

        {/* Modal Historial SIGA */}
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