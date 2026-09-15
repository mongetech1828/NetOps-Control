import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";

function Ordenes() {

  const [ordenes, setOrdenes] = useState([]);
  const [filtroOST, setFiltroOST] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtrocliente, setFiltroCliente] = useState("");
  const [estados, setEstados] = useState([]);
  const [formData, setFormData] = useState({
    tipo_registro: "OST",
    numero_ost: "",
    numero_linea: "",
    cliente: "",
    estado_id: "",
    observaciones: ""
  });

  useEffect(() => {
  cargarOrdenes();
  cargarEstados();
  }, []);

  async function guardarOrden() {

  const { data, error } =
    await supabase
      .from("ordenes")
      .insert([
        {
          tipo_registro: formData.tipo_registro,
          numero_ost: formData.numero_ost,
          numero_linea: formData.numero_linea,
          cliente: formData.cliente,
          estado_id: formData.estado_id,
          observaciones: formData.observaciones,
          fecha_recepcion: formData.fecha_recepcion
        }
      ]);

  console.log(data);
  console.log(error);

  await cargarOrdenes();

  setFormData({
    tipo_registro: "OST",
    numero_ost: "",
    numero_linea: "",
    cliente: "",
    estado_id: "",
    fecha_recepcion: "",
    observaciones: ""
  });

  }

  async function cargarOrdenes() {

  const { data } =
    await supabase
      .from("ordenes")
      .select('*, estado ( nombre )')
      .order("id", { ascending: false });

  setOrdenes(data || []);
  }

  async function cargarEstados() {

  const { data } = await supabase
    .from("estado")
    .select("*")
    .order("nombre");

  setEstados(data || []);
  }

  return (
    
    <div>

      <h1>Órdenes</h1>

      <button onClick={() => setMostrarFormulario(!mostrarFormulario)}>
        Nueva Orden
      </button>

      {mostrarFormulario && (
        <div>
          <br /><br />

          <input
            placeholder="Número OST"
            value={formData.numero_ost}
            onChange={(e) =>
          setFormData({
            ...formData,
            numero_ost: e.target.value
          })
        }
      />

      <br /><br />

      <input
        placeholder="Número Línea"
        value={formData.numero_linea}
        onChange={(e) =>
          setFormData({
            ...formData,
            numero_linea: e.target.value
          })
        }
      />

      <br /><br />

      <input
        placeholder="Cliente"
        value={formData.cliente}
        onChange={(e) =>
          setFormData({
            ...formData,
            cliente: e.target.value
          })
        }
      />

      <br /><br />

      <select
        value={formData.estado_id}
        onChange={(e) =>
          setFormData({
            ...formData,
            estado_id: e.target.value
          })
        }
      >
        <option value="">Seleccionar Estado</option>
        {estados.map((estado) => (
          <option key={estado.id} value={estado.id}>
            {estado.nombre}
          </option>
        ))}
      </select>

      <br /><br />

      <input
        type="date"
        value={formData.fecha_recepcion}
        onChange={(e) =>
          setFormData({
            ...formData,
            fecha_recepcion: e.target.value
          })
        }
      />

      <br /><br />

      <textarea
        placeholder="Observaciones"
        value={formData.observaciones}
        onChange={(e) =>
          setFormData({
            ...formData,
            observaciones: e.target.value
          })
        }
      />

      <br /><br />

      <button
        onClick={guardarOrden}
      >
        Guardar Orden
      </button>

    </div>
  )}

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
            <th>ID</th>
            <th>OST</th>
            <th>Línea</th>
            <th>Cliente</th>
            <th>Estado</th>
            <th>Fecha de Recepción</th>
            <th>Observaciones</th>
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
              <td>{orden.id}</td>
              <td>{orden.numero_ost}</td>
              <td>{orden.numero_linea}</td>
              <td>{orden.cliente}</td>
              <td>{orden.estado?.nombre}</td>
              <td>{orden.fecha_recepcion}</td>
              <td>{orden.observaciones}</td>
              <td>
                <button>Editar</button>
                <button>Borrar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );


}

export default Ordenes;