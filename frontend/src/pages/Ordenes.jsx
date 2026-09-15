import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";

function Ordenes() {

  const [ordenes, setOrdenes] = useState([]);
  const [formData, setFormData] = useState({
    tipo_registro: "OST",
    numero_ost: "",
    numero_linea: "",
    cliente: "",
    observaciones: ""
  });

  useEffect(() => {
  cargarOrdenes();
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
          observaciones: formData.observaciones
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
    observaciones: ""
  });

  }

  async function cargarOrdenes() {

  const { data } =
    await supabase
      .from("ordenes")
      .select("*")
      .order("id", { ascending: false });

  setOrdenes(data || []);
  }

  return (
    <div>

      <h1>Órdenes</h1>

      <button>
        Nueva Orden
      </button>

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

      <hr />

      <h2>Órdenes Registradas</h2>

      {ordenes.map((orden) => (
        <div key={orden.id}>
          
          {orden.numero_ost}
          {" - "}
          {orden.cliente}

        </div>
      ))}
      
    </div>
  );


}

export default Ordenes;