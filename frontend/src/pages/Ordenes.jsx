import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";

function Ordenes() {

  const [ordenes, setOrdenes] = useState([]);
  const [filtroOST, setFiltroOST] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtrocliente, setFiltroCliente] = useState("");
  const [estados, setEstados] = useState([]);
  const [tiposServicio, setTiposServicio] = useState([]);
  const [transporte, setTransporte] = useState([]);
  const [ordenEditando, setOrdenEditando] = useState(null);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [historialOrden, setHistorialOrden] = useState([]);
  const [ordenHistorial, setOrdenHistorial] = useState(null);  
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
    observaciones: ""
  };
  const [formData, setFormData] = useState(formularioVacio);

  useEffect(() => {
    cargarOrdenes();
    cargarEstados();
    cargarTiposServicio();
    cargarTransporte();
  }, []);

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

  function formatearFechaHoraDB(fecha) {

    const anio = fecha.getFullYear();

    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
      fecha.getDate()
    ).padStart(2, "0");

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


  async function guardarOrden() {

    const fechaMaxima = sumarDiasHabiles(formData.fecha_recepcion, 4);
    const { data: ordenExistente } = await supabase
      .from("ordenes")
      .select("id")
      .eq("numero_ost", formData.numero_ost);

    if (!formData.numero_ost) {alert("Debe indicar el número OST");
      return;
    }
    if (!formData.numero_linea) {alert("Debe indicar el número línea");
      return;
    }
    if (!formData.cliente) {alert("Debe indicar el Cliente");
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

    if (!ordenEditando &&
        ordenExistente &&
        ordenExistente.length > 0) {
          alert("La OST ya existe. Utilice Editar o Reingresar.");

          setFormData(formularioVacio);

          return;
      }

    if (ordenEditando) {
      const { data:ordenActual } = await supabase
        .from("ordenes")
        .select("*")
        .eq("id", ordenEditando)
        .single();
      const { data, error } = await supabase
        .from("ordenes")
        .update({
          numero_ost: formData.numero_ost,
          numero_linea: formData.numero_linea,
          evento_agil: formData.evento_agil,
          cliente: formData.cliente,
          tipo_servicio_id: formData.tipo_servicio_id,
          transporte_id: formData.transporte_id,
          estado_id: formData.estado_id,
          observaciones: formData.observaciones
        })
        .eq("id", ordenEditando);

        //Registrando historial de movimientos
      if (!error) {
        if (ordenActual.estado_id !== Number(formData.estado_id)) {
          const { data: {user} } = await supabase.auth.getUser();

          const { data: estadoAnterior } = await supabase
            .from("estado")
            .select("nombre")
            .eq("id", ordenActual.estado_id)
            .single();

          const { data: estadoNuevo } = await supabase
            .from("estado")
            .select("nombre")
            .eq("id", formData.estado_id)
            .single();

          await supabase
            .from("historial_movimientos")
            .insert([
              {
                orden_id: ordenEditando,
                usuario_id: user.id,
                estado_anterior : ordenActual.estado_id,
                estado_nuevo: Number(formData.estado_id),

                comentario: `Cambio de estado de "${estadoAnterior.nombre}" a "${estadoNuevo.nombre}" por el usuario ${user.email}`
              }
            ]);
        }
      }

      } else {

        console.log(formData);

        const { data, error } = await supabase
          .from("ordenes")
          .insert([
            {
              tipo_registro: formData.tipo_registro,
              numero_ost: formData.numero_ost,
              numero_linea: formData.numero_linea,
              evento_agil: formData.evento_agil,
              cliente: formData.cliente,
              tipo_servicio_id: formData.tipo_servicio_id,
              transporte_id: formData.transporte_id,
              estado_id: formData.estado_id,
              observaciones: formData.observaciones,
              fecha_recepcion: formData.fecha_recepcion,
              fecha_maxima_atencion: formatearFechaDB(fechaMaxima)
            }
          ])
          .select()
          .single();

        if (!error) {
          const { data: {user} } = await supabase.auth.getUser();

          await supabase
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
        }
      }

    await cargarOrdenes();
    setMostrarFormulario(false);  
    setFormData(formularioVacio);
    setOrdenEditando(null);
  } 

  async function cargarOrdenes() {

  const { data } =
    await supabase
      .from("ordenes")
      .select('*, estado ( nombre ),tipo_servicio(nombre),transporte(nombre)')
      .order("id", { ascending: false });

      console.log(data);

  setOrdenes(data || []);
  }

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
      fecha_recepcion: orden.fecha_recepcion?.split("T")[0] || ""
    });

    setMostrarFormulario(true);
  }

  async function reingresarOrden(orden) {

    const motivo = window.prompt(`Ingrese el motivo del reingreso OST ${orden.numero_ost}`);

    if (!motivo) {
      return;
    }

    const fechaRecepcion = new Date();
    const fechaMaxima =
      sumarDiasHabiles(
        fechaRecepcion,
        4
      );

    const confirmar = window.confirm(`¿Está seguro de reingresar la OST: ${orden.numero_ost}?`);

    if (!confirmar) {
      return;
    }

    const { error } = await supabase
      .from("ordenes")
      .update({

        fecha_recepcion:
          formatearFechaDB(fechaRecepcion),

        fecha_maxima_atencion:
          formatearFechaDB(fechaMaxima),

        cantidad_reingresos:
          (orden.cantidad_reingresos || 0) + 1,

        fecha_ultimo_reingreso: formatearFechaHoraDB(new Date()),

        motivo_reingreso: motivo

      })
    .eq("id", orden.id);

    if (error) {
      console.error(error);
      return;
    }

    const {data: {user}} = await supabase.auth.getUser();
    const { error:errorHistorial } = await supabase
      .from("historial_movimientos")
      .insert({
          orden_id: orden.id,
          usuario_id: user.id,
          estado_anterior : orden.estado_id,
          estado_nuevo: orden.estado_id,
          comentario: `OST ${orden.numero_ost} reingresada. Motivo: ${motivo}. Reingreso #${(orden.cantidad_reingresos || 0) + 1}`        
        })

    .select();

    console.log("error historial: ", errorHistorial);

    await cargarOrdenes();

  }

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

    console.log(data);
    console.log("Mostrando historial");
    setMostrarHistorial(true);
  }

  async function cargarEstados() {

    const { data } = await supabase
      .from("estado")
      .select("*")
      .order("nombre");

    setEstados(data || []);
  }

  async function cargarTiposServicio() {

    const { data } = await supabase
      .from("tipo_servicio")
      .select("*")
      .order("nombre");

    setTiposServicio(data || []);

  }

  async function cargarTransporte() {

    const { data } = await supabase
      .from("transporte")
      .select("*")
      .order("nombre");

    setTransporte(data || []);

  }

  function sumarDiasHabiles(fecha, diasHabiles) {
    const resultado = new Date(fecha);
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

  function formatoFecha(fecha) {
    return new Date(fecha).toLocaleDateString("es-CR");
  }

  function diasRestantes(fechaMaxima) {
    const hoy = new Date();
    const fecha = new Date(fechaMaxima);

    const diffTime = fecha - hoy;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  function estadoSLA(dias) {

    if (dias > 2) {
      return "🟢 En SLA";
    }

    if (dias >= 1 && dias <= 2) {
      return "🟡 Prox. vencer";
    }

    if (dias === 0) {
      return "🔴 Vence hoy";
    }

    return "⚫ Vencida";
  }

  return (
    
    <div>

      <h1>Órdenes</h1>

      <button onClick={() => setMostrarFormulario(true)}>
        Nueva Orden
      </button>

      {
        mostrarFormulario && (
          <div className="modal-overlay">
            <div className="modal-content">

              <div>
                <h3>
                  {ordenEditando
                    ? "Editar Orden"
                    : "Nueva Orden"}
                </h3>

                <br /><br />

                <div
                  style={{
                    display: "flex",
                    gap: "20px",
                    justifyContent: "center"
                  }}
                >
                  <input
                    style={{ width: "45%"}}
                    placeholder="Número OST"
                    value={formData.numero_ost || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numero_ost: e.target.value
                      })
                    }
                  />
                  <input
                    style={{width: "45%"}}
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

                <br />

                <input
                  style={{width: "45%"}}
                  placeholder="Cliente"
                  value={formData.cliente}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cliente: e.target.value})
                  }
                />

                <br/><br />

                <div
                  style={{
                    display: "flex",
                    gap: "20px",
                    justifyContent: "center"
                  }}
                >
                  <select
                    value={formData.estado_id || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estado_id: e.target.value})
                      }
                    style={{width: "180px"}}
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

                  <input                    
                    type="date"
                    value={formData.fecha_recepcion || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fecha_recepcion: e.target.value})
                    }
                    disabled={ordenEditando !== null}
                    style={{width: "180px", backgroundColor: ordenEditando !== null ? "#f3f4f6" : "white" }}
                  />
                </div>

                <br /><br />

                <div
                  style={{
                    display: "flex",
                    gap: "20px",
                    justifyContent: "center"
                  }}
                >

                  <select
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
                    value={
                      formData.transporte_id || ""
                    }
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

                <br /><br />

                <textarea
                  style={{width: "45%"}}
                  placeholder="Observaciones"
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      observaciones: e.target.value})
                  }
                />

                <br /><br />

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "center",
                    marginTop: "20px"
                  }}
                >
                  <button
                    onClick={guardarOrden}
                  >
                    {ordenEditando
                     ? "Actualizar Orden"
                     : "Guardar Orden"}
                  </button>
                  <button
                    onClick={() => {
                      setMostrarFormulario(false);
                      setOrdenEditando(null);
                      setFormData(formularioVacio);
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

      <h2>Órdenes Registradas</h2>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px"
        }}
      >

        <input
          placeholder="Buscar OST"
          value={filtroOST}
          onChange={(e) => setFiltroOST(e.target.value)}
        />

        <input
          placeholder="Buscar Cliente"
          value={filtrocliente}
          onChange={(e) => setFiltroCliente(e.target.value)}
        />

      </div>

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
            <th>Días</th>
            <th>SLA</th>
            <th>Reing.</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {ordenes.filter((orden) => 
            orden.numero_ost
              .toLowerCase().includes(filtroOST.toLowerCase())
          )
          .filter((orden) =>
            orden.cliente
              .toLowerCase().includes(filtrocliente.toLowerCase())
          )
          .map((orden) => (
            <tr key={orden.id}>
              <td>{orden.numero_ost}</td>
              <td>{orden.numero_linea}</td>
              <td>{orden.evento_agil}</td>
              <td>{orden.cliente}</td>
              <td>{orden.tipo_servicio?.nombre || "-"}</td>
              <td>{orden.transporte?.nombre || "-"}</td>
              <td>{orden.estado?.nombre}</td>
              <td>{diasRestantes(orden.fecha_maxima_atencion)}</td>
              <td>{estadoSLA(diasRestantes(orden.fecha_maxima_atencion))}</td>
              <td>{orden.cantidad_reingresos}</td>
              <td>
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
              </td>
            </tr>
          ))}
        </tbody>
      </table> 
      
      { 
        mostrarHistorial && (
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
                  <strong>Técnicos:</strong><br />
                  Pendiente
                </div>
              </div>

              <div style={{ marginTop: "20px" }}>
                <strong>Observaciones:</strong><br />
                {ordenHistorial?.observaciones || "-"}
              </div>

              <hr style={{ margin: "20px 0"}} />

              <h3>Timeline OST</h3>

              <div>

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
                          width: "20px",
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
                          paddingLeft: "15px",
                          marginLeft: "-6px"
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

export default Ordenes;