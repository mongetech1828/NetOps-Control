import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";

function SIGA() {

  const [sigas, setSigas] = useState([]);
  const [estadosSIGA, setEstadosSIGA] = useState([]);
  const [prioridadesSIGA, setPrioridadesSIGA] = useState([]);
  const [gruposGestion, setGruposGestion] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [tiposServicio, setTiposServicio] = useState([]);
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

  async function cargarSigas() {
    const { data } = await supabase
      .from("sigas")
      .select(`
        *,
        estados_siga(nombre),
        prioridades_siga(prioridad),
        grupos_gestion(nombre),
        tecnicos(nombre),
        tipo_servicio(nombre)
      `)
      .order("id", {
        ascending: false
      });
    setSigas(data || []);
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

    const { error } = await supabase
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
          nivel: formData.nivel,
          fecha_recepcion: formData.fecha_recepcion,
          descripcion: formData.descripcion,
          observaciones: formData.observaciones
        }
      ]);

    if (error) {
      console.error(error);
      return;
    }

    await cargarSigas();
    setMostrarFormulario(false);
    setFormData(formularioVacio);
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
        onClick={() =>
          setMostrarFormulario(true)
        }
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
            <th>Nivel</th>
            <th>Grupo</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {sigas.map((siga) => (
            <tr key={siga.id}>

              <td>
                {siga.numero_siga}
              </td>

              <td>
                {siga.numero_linea}
              </td>

              <td>
                {siga.evento_agil}
              </td>

              <td>
                {siga.cliente}
              </td>

              <td>
                {siga.tipo_servicio?.nombre || "-"}
              </td>

              <td>
                {
                  siga.prioridades_siga
                    ?.prioridad
                }
              </td>

              <td>
                {
                  siga.estados_siga
                    ?.nombre
                }
              </td>

              <td>
                {siga.nivel}
              </td>

              <td>
                {
                  siga.grupos_gestion
                    ?.nombre
                }
              </td>

              <td>
                <button>
                  Editar
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

                <select
                  value={formData.nivel || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nivel: e.target.value
                    })
                  }
                >
                  <option value="GT">GT</option>
                  <option value="ST">ST</option>
                  <option value="CO">CO</option>
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
                type="date"
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
                  onClick={() =>
                    setMostrarFormulario(false)
                  }
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
}

export default SIGA;