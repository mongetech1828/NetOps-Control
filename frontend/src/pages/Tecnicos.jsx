import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import HistorialOrdenModal from "../components/HistorialOrdenModal";
import HistorialSIGAModal from "../components/HistorialSIGAModal";

function Tecnicos() {

  const [tecnicos, setTecnicos] = useState([]);
  const [filtroTecnico, setFiltroTecnico] = useState("");
  const [actualizandoTecnicos, setActualizandoTecnicos] = useState(false);
  const [mostrarDetalleTecnico, setMostrarDetalleTecnico] = useState(false);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState(null);
  const [sigasTecnico, setSigasTecnico] = useState([]);
  const [ordenesTecnico, setOrdenesTecnico] = useState([]);
  const [mostrarFormularioTecnico,  setMostrarFormularioTecnico] = useState(false);
  const [tecnicoEditando, setTecnicoEditando] = useState(null);
  const [historialSIGA, setHistorialSIGA] = useState(null);
  const [sigaHistorial, setSigaHistorial] = useState(null);
  const [mostrarHistorialSIGA, setMostrarHistorialSIGA] = useState(false);
  const [historialOrden, setHistorialOrden] = useState([]);
  const [ordenHistorial, setOrdenHistorial] = useState(null);
  const [mostrarHistorialOrden, setMostrarHistorialOrden] = useState(false);
  const tecnicoVacio = {
    nombre: "",
    correo: "",
    telefono: "",
    zona: "",
    especialidad: "",
    activo: true
  };
  const [formDataTecnico, setFormDataTecnico] = useState(tecnicoVacio);

  function contarSigasAbiertos(tecnico) {
    return tecnico.siga_tecnicos?.filter(
      ({ sigas }) => sigas && sigas.estados_siga?.nombre !== "Cerrado"
    ).length || 0;
  }

  function contarOrdenesAbiertas(tecnico) {
    return tecnico.orden_tecnicos?.filter(
      ({ ordenes }) => ordenes && ordenes.estado?.nombre !== "Cerrado"
    ).length || 0;
  }

  useEffect(() => {
    const fetchTecnicos = async () => {
      const { data, error } = await supabase
        .from("tecnicos")
        .select(`
          *,
          siga_tecnicos(
            id,
            sigas(estados_siga(nombre))
          ),
          orden_tecnicos(
            id,
            ordenes(estado(nombre))
          )
        `)

      .order("id", { ascending: true });
      if (error) {
        console.error("Error fetching tecnicos:", error);
        alert("No se pudo cargar la lista de técnicos.");
      } else {
        setTecnicos(data);
      }
    };

    fetchTecnicos();
  }, []);

  async function verTecnico(tecnico) {

    setTecnicoSeleccionado(tecnico);

    const {
      data: sigasData,
      error: errorSigas
    } = await supabase
      .from("siga_tecnicos")
      .select(`sigas(id,numero_siga,cliente,estados_siga(nombre))`)
      .eq("tecnico_id",tecnico.id);

    const {
      data: ordenesData,
      error: errorOrdenes
    } = await supabase
      .from("orden_tecnicos")
      .select(`ordenes(id,numero_ost,cliente,estado(nombre))`)
      .eq("tecnico_id",tecnico.id);

    if (errorSigas || errorOrdenes) {
      console.error("Error fetching technician assignments:", errorSigas || errorOrdenes);
      alert("No se pudieron cargar las asignaciones abiertas del técnico.");
      return;
    }

    setSigasTecnico((sigasData || []).filter(
      ({ sigas }) => sigas && sigas.estados_siga?.nombre !== "Cerrado"
    ));
    setOrdenesTecnico((ordenesData || []).filter(
      ({ ordenes }) => ordenes && ordenes.estado?.nombre !== "Cerrado"
    ));
    setMostrarDetalleTecnico(true);

  }

  function nuevoTecnico() {
    setTecnicoEditando(null);
    setFormDataTecnico(
      tecnicoVacio
    );

    setMostrarFormularioTecnico(true);
  }

  function editarTecnico(tecnico) {

    setTecnicoEditando(tecnico.id );

    setFormDataTecnico({
      nombre: tecnico.nombre || "",
      correo: tecnico.correo || "",
      telefono: tecnico.telefono || "",
      zona: tecnico.zona || "",
      especialidad: tecnico.especialidad || "",
      activo: tecnico.activo
    });

    setMostrarFormularioTecnico(true);
  }

  async function guardarTecnico() {

    if (tecnicoEditando) {
      const { error } = await supabase
        .from("tecnicos")
        .update({
          nombre: formDataTecnico.nombre,
          correo: formDataTecnico.correo,
          telefono: formDataTecnico.telefono,
          zona: formDataTecnico.zona,
          especialidad: formDataTecnico.especialidad,
          activo: formDataTecnico.activo
        })
        .eq("id", tecnicoEditando);

      if (error) {
        console.error("Error updating tecnico:", error);
        return;
      }

    } else {

      const { error } = await supabase
        .from("tecnicos")
        .insert([formDataTecnico]);

      if (error) {
        console.error("Error inserting tecnico:", error);
        return;
      }
    }

    await cargarTecnicos();
    setMostrarFormularioTecnico(false);
    setTecnicoEditando(null);
  }

  async function cargarTecnicos() {
    const { data, error } =
      await supabase
        .from("tecnicos")
        .select(`
          *,
          siga_tecnicos(
            id,
            sigas(estados_siga(nombre))
          ),
          orden_tecnicos(
            id,
            ordenes(estado(nombre))
          )
        `);

    if (error) {
      console.error(
        "Error fetching tecnicos:",
        error
      );
      alert("No se pudo actualizar la lista de técnicos.");

    } else {

      setTecnicos(data);

    }
  }

  async function actualizarTecnicos() {
    if (actualizandoTecnicos) return;

    setActualizandoTecnicos(true);
    try {
      await cargarTecnicos();
    } catch (error) {
      console.error("Error refreshing tecnicos:", error);
      alert("Ocurrió un error al actualizar la lista de técnicos.");
    } finally {
      setActualizandoTecnicos(false);
    }
  }

  async function cambiarEstadoTecnico(tecnico) {

    const nuevoEstado = !tecnico.activo;

    await supabase
      .from("tecnicos")
      .update({ activo: nuevoEstado })
      .eq("id", tecnico.id);

    await cargarTecnicos();
  }

  async function abrirOrdenDesdeTecnico(idOrden) {
    const { data, error } =
      await supabase
        .from("ordenes")
        .select(`
          *,
          estado(nombre),
          tipo_servicio(nombre),
          transporte(nombre),
          orden_tecnicos(tecnico_id,tecnicos(nombre))
        `)
        .eq("id", idOrden)
        .single();

    if (error) {
      console.error(error);
      return;
    }

    console.log(data);
    setOrdenHistorial(data);

    const { data: historial } =
      await supabase
        .from("historial_movimientos")
        .select(`
          *,
          estado!estado_nuevo(nombre),
          perfiles!usuario_id(nombre,correo)
        `)
        .eq("orden_id", idOrden)
        .order("fecha_movimiento", {
          ascending: false
        });
    
    setHistorialOrden(historial || []);
    setMostrarHistorialOrden(true);
  }

  async function abrirSIGADesdeTecnico(idSIGA) {
    const { data, error } =
      await supabase
        .from("sigas")
        .select(`
          *,
          estados_siga(nombre),
          prioridades_siga(prioridad, horas_sla),
          grupos_gestion(nombre),
          tipo_servicio(nombre),
          siga_tecnicos(tecnico_id, tecnicos(nombre))
        `)
        .eq("id", idSIGA)
        .single();

    if (error) {
      console.error(error);
      return;
    }

    setSigaHistorial(data);

    const { data: historial } =
      await supabase
        .from ("historial_siga")
        .select(`
          *,
          estados_siga!estado_nuevo(nombre),
          perfiles!usuario_id(nombre, correo)
        `)
        .eq("siga_id", idSIGA)
        .order("fecha_movimiento", {
          ascending: false
        });
    setHistorialSIGA(historial || []);
    setMostrarHistorialSIGA(true);
  }

  const tecnicosFiltrados = tecnicos.filter((tecnico) =>
    (tecnico.nombre || "")
      .toLowerCase()
      .includes(filtroTecnico.trim().toLowerCase())
  );

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
            Técnicos
          </h1>          

          <button
            onClick={nuevoTecnico}
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
              cursor: "pointer"
            }}
          >
            ➕ Nuevo Técnico
          </button>

        </div>

        <hr />

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "20px",
            marginBottom: "15px"
          }}
        >
          <input
            type="search"
            placeholder="Buscar técnico por nombre"
            value={filtroTecnico}
            onChange={(e) => setFiltroTecnico(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              flex: 1
            }}
          />
          <button
            type="button"
            onClick={actualizarTecnicos}
            disabled={actualizandoTecnicos}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              cursor: actualizandoTecnicos ? "wait" : "pointer"
            }}
            title="Actualizar técnicos y asignaciones abiertas"
          >
            {actualizandoTecnicos ? "Actualizando..." : "↻ Actualizar"}
          </button>
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "30px"
          }}
        >

          <thead>
            <tr>
              <th>Nombre</th>
              <th>SIGAs</th>
              <th>Órdenes</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>              
            </tr>
          </thead>

          <tbody>

            {tecnicosFiltrados.map((tecnico) => (

              <tr key={tecnico.id}>

                <td>{tecnico.nombre}</td>          
                <td>{contarSigasAbiertos(tecnico)}</td>
                <td>{contarOrdenesAbiertas(tecnico)}</td>
                <td>{contarSigasAbiertos(tecnico) + contarOrdenesAbiertas(tecnico)}</td>
                <td>{tecnico.activo ? (
                  <span style={{ color: "#16a34a", fontWeight: "600" }}>● Activo</span>) : (<span style={{ color: "#6b7280", fontWeight: "600" }}>● Inactivo</span>
                )}</td>
                <td>
                  <div style={{
                    display: "flex",
                    gap: "4px",
                    justifyContent: "center"
                  }}>
                    <button onClick={() => verTecnico(tecnico)}>Ver</button>
                    <button onClick={() => editarTecnico(tecnico)}>Editar</button>
                    <button onClick={() => cambiarEstadoTecnico(tecnico)}>
                      {tecnico.activo ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </td>
              </tr>
              ))}
            {tecnicosFiltrados.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "16px" }}>
                  No se encontraron técnicos con ese nombre.
                </td>
              </tr>
            )}

          </tbody>

        </table>

        {
          mostrarDetalleTecnico &&
          tecnicoSeleccionado && (

            <div className="modal-overlay">

              <div
                className="modal-content"
                style={{
                  maxWidth: "900px"
                }}
              >

                <h2>
                  {tecnicoSeleccionado.nombre}
                </h2>

                <hr />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "15px",
                    marginTop: "15px"
                  }}
                >

                  <div>

                    <strong>
                      Correo
                    </strong>

                    <br />

                    {tecnicoSeleccionado.correo}

                  </div>

                  <div>

                    <strong>Teléfono</strong>

                    <br />

                    {tecnicoSeleccionado.telefono}

                  </div>

                  <div>

                    <strong>Zona</strong>

                    <br />

                    {tecnicoSeleccionado.zona}

                  </div>

                  <div>

                    <strong>Especialidad</strong>

                    <br />

                    {tecnicoSeleccionado.especialidad}

                  </div>

                </div>

                <hr
                  style={{
                    marginTop: "20px"
                  }}
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    textAlign: "center",
                    marginTop: "15px"
                  }}
                >

                  <div
                    style={{
                      backgroundColor: "#dbeafe",
                      color: "#1e40af",
                      borderRadius: "8px",
                      padding: "10px"
                    }}
                  >

                    <strong>SIGAs</strong>

                    <br />

                    {
                      sigasTecnico.length
                    }

                  </div>

                  <div
                    style={{
                      backgroundColor: "#e9d5ff",
                      color: "#7c3aed",
                      borderRadius: "8px",
                      padding: "10px"
                    }}
                  >

                    <strong>Órdenes</strong>

                    <br />

                    {
                      ordenesTecnico.length
                    }

                  </div>

                  <div
                    style={{
                      backgroundColor: "#cffafe",
                      color: "#0891b2",
                      borderRadius: "8px",
                      padding: "10px"
                    }}
                  >

                    <strong>Total</strong>

                    <br />

                    {
                      sigasTecnico.length + ordenesTecnico.length
                    }

                  </div>

                </div>

                <hr
                  style={{
                    marginTop: "20px"
                  }}
                />

                <div
                  style={{
                    marginTop: "15px"
                  }}
                >
                  <h3>
                    SIGAs Asignados
                  </h3>

                  {
                    sigasTecnico.length > 0
                      ? (
                          <ul>
                            {sigasTecnico.map(
                              (item, index) => (

                                <li key={index}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      abrirSIGADesdeTecnico(
                                        item.sigas?.id
                                      )
                                    }
                                    style={{
                                      border: "none",
                                      background: "none",
                                      color: "#2563eb",
                                      cursor: "pointer",
                                      padding: 0,
                                      fontWeight: "600"
                                    }}
                                  >
                                    {item.sigas?.numero_siga}
                                  </button>
                                  {" - "}
                                  {item.sigas?.cliente}
                                  {" | "}
                                  <strong>
                                    {item.sigas?.estados_siga?.nombre}
                                  </strong>
                                </li>

                              )
                            )}
                          </ul>
                        )
                      : (
                          <p>
                            No tiene SIGAs asignados
                          </p>
                        )
                  }
                </div>

                <div
                  style={{
                    marginTop: "15px"
                  }}
                >

                  <h3>
                    Órdenes Asignadas
                  </h3>

                  {
                    ordenesTecnico.length > 0
                      ? (
                          <ul>
                            {ordenesTecnico.map(
                              (item, index) => (

                                <li key={index}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      abrirOrdenDesdeTecnico(
                                        item.ordenes?.id
                                      )
                                    }
                                    style={{
                                      border: "none",
                                      background: "none",
                                      color: "#2563eb",
                                      cursor: "pointer",
                                      padding: 0,
                                      fontWeight: "600"
                                    }}
                                  >
                                    {item.ordenes?.numero_ost}
                                  </button>
                                  {" - "}
                                  {item.ordenes?.cliente}
                                  {" | "}
                                  <strong>
                                    {item.ordenes?.estado?.nombre}
                                  </strong>
                                </li>

                              )
                            )}
                          </ul>
                        )
                      : (
                          <p>
                            No tiene órdenes asignadas
                          </p>
                        )
                  }
                </div>               


                <div
                  style={{
                    marginTop: "25px",
                    textAlign: "center"
                  }}
                >
                  <button
                    style={{
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                    onClick={() =>
                      setMostrarDetalleTecnico(
                        false
                      )
                    }
                  >
                    Cerrar
                  </button>

                </div>

              </div>

            </div>

          )
        }
      </div>

      {
        mostrarFormularioTecnico && (

          <div className="modal-overlay">

            <div
              className="modal-content"
              style={{maxWidth: "650px", width: "90%"}}
            >

              <h2>
                {
                  tecnicoEditando
                    ? "Editar Técnico"
                    : "Nuevo Técnico"
                }

              </h2>

              <div
                style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "20px"}}
              >

                <input
                  style={{
                    width: "90%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db"
                  }}
                  placeholder="Nombre"
                  value={formDataTecnico.nombre}
                  onChange={(e) =>
                    setFormDataTecnico({
                      ...formDataTecnico,
                      nombre: e.target.value
                    })
                  }
                />

                <input
                  style={{
                    width: "90%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db"
                  }}
                  placeholder="Correo"
                  value={formDataTecnico.correo}
                  onChange={(e) =>
                    setFormDataTecnico({
                      ...formDataTecnico,
                      correo: e.target.value
                    })
                  }
                />

                <input
                  style={{
                    width: "90%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db"
                  }}
                  placeholder="Teléfono"
                  value={formDataTecnico.telefono}
                  onChange={(e) =>
                    setFormDataTecnico({
                      ...formDataTecnico,
                      telefono: e.target.value
                    })
                  }
                />

                <input
                  style={{
                    width: "90%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db"
                  }}
                  placeholder="Zona"
                  value={
                    formDataTecnico.zona
                  }
                  onChange={(e) =>
                    setFormDataTecnico({
                      ...formDataTecnico,
                      zona: e.target.value
                    })
                  }
                />

              </div>

              <div
                style={{
                  marginTop: "15px"
                }}
              >

                <input
                  style={{
                    width: "90%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db"
                  }}
                  placeholder="Especialidad"
                  value={formDataTecnico.especialidad}
                  onChange={(e) =>
                    setFormDataTecnico({
                      ...formDataTecnico,
                      especialidad: e.target.value
                    })
                  }
                />

              </div>

              <div
                style={{
                  marginTop: "20px",
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
                  onClick={guardarTecnico}
                >
                  Guardar
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
                  onClick={() => setMostrarFormularioTecnico(false)}
                >
                  Cancelar
                </button>
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

      <HistorialOrdenModal
        visible={mostrarHistorialOrden}
        ordenHistorial={ordenHistorial}
        historialOrden={historialOrden}
        onClose={() =>
          setMostrarHistorialOrden(false)
        }
      />

    </div>
  );
}

export default Tecnicos;