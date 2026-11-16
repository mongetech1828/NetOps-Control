import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend,
} from "recharts";


function Reportes() {

  const [periodo, setPeriodo] = useState("mes");  

  const ordenesMes = [
    { mes: "Jul", cantidad: 18 },
    { mes: "Ago", cantidad: 25 },
    { mes: "Sep", cantidad: 31 },
    { mes: "Oct", cantidad: 29 },
    { mes: "Nov", cantidad: 42 },
  ];

  const sigasMes = [
    { mes: "Jul", cantidad: 5 },
    { mes: "Ago", cantidad: 8 },
    { mes: "Sep", cantidad: 10 },
    { mes: "Oct", cantidad: 12 },
    { mes: "Nov", cantidad: 15 },
  ];

  const tiempoOrdenes = [
    { mes: "Jul", dias: 4.2 },
    { mes: "Ago", dias: 3.9 },
    { mes: "Sep", dias: 3.5 },
    { mes: "Oct", dias: 3.0 },
    { mes: "Nov", dias: 2.8 },
  ];

  const tiempoSigas = [
    { mes: "Jul", horas: 30 },
    { mes: "Ago", horas: 24 },
    { mes: "Sep", horas: 22 },
    { mes: "Oct", horas: 18 },
    { mes: "Nov", horas: 14 },
  ];  

  const datosTecnicos = [
    {
      nombre: "Jesús Mora",
      ordenes: 45,
      sigas: 7,
      total: 52,
      tiempoOrdenes: "2.1 días",
      tiempoSigas: "14 horas"
    },
    {
      nombre: "Emmanuel Méndez",
      ordenes: 39,
      sigas: 5,
      total: 44,
      tiempoOrdenes: "2.4 días",
      tiempoSigas: "15 horas"
    },
    {
      nombre: "Giovanni Rodríguez",
      ordenes: 33,
      sigas: 5,
      total: 38,
      tiempoOrdenes: "2.8 días",
      tiempoSigas: "18 horas"
    }
  ];

  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState(
    datosTecnicos[0].nombre
  );
  const tecnico =
    datosTecnicos.find(
      (t) => t.nombre === tecnicoSeleccionado
    ) || datosTecnicos[0];

  const productividadTecnicos = datosTecnicos.map((t) => ({
    tecnico: t.nombre.split(" ")[0],
    ordenes: t.ordenes,
    sigas: t.sigas,
  }));

  const cardStyle = {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    transition: "all 0.2s ease"
  };

  return (
    <div>

      <h1>Reportes</h1>

      <p>
        Indicadores de productividad y desempeño operativo.
      </p>

      <br />

      <div
        style={{
          display: "flex",
          gap: "15px",
          marginBottom: "30px"
        }}
      >
        <select
          value={periodo}
          onChange={(e) =>
            setPeriodo(e.target.value)
          }
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #d1d5db"
          }}
        >
          <option value="hoy">Hoy</option>
          <option value="7dias">Últimos 7 días</option>
          <option value="mes">Mes Actual</option>
          <option value="30dias">Últimos 30 días</option>
          <option value="anio">Este Año</option>
        </select>

        <select
          value={tecnico}
          onChange={(e) =>
            setTecnico(e.target.value)
          }
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #d1d5db"
          }}
        >
          <option value="todos">
            Todos los Técnicos
          </option>
        </select>
      </div>

      {/* KPI */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginBottom: "30px"
        }}
      >

        <div
          style={{
            ...cardStyle,
            borderLeft: "5px solid #2563eb"
          }}
        >
          <h3>Órdenes Ejecutadas</h3>
          <h1>245</h1>
        </div>

        <div
          style={{
            ...cardStyle,
            borderLeft: "5px solid #22c55e"
          }}
        >
          <h3>Tiempo Promedio Órdenes</h3>
          <h1>2.8 días</h1>
        </div>

        <div
          style={{
            ...cardStyle,
            borderLeft: "5px solid #8b5cf6"
          }}
        >
          <h3>SIGAs Cerrados</h3>
          <h1>38</h1>
        </div>

        <div
          style={{
            ...cardStyle,
            borderLeft: "5px solid #f59e0b"
          }}
        >
          <h3>Tiempo Promedio SIGAs</h3>
          <h1>14h 32m</h1>
        </div>

      </div>

      {/* GRAFICOS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "30px"
        }}
      >
        <div className="bg-white rounded-xl shadow p-6 h-80">
          <h3 className="text-xl font-semibold text-center mb-4">
            Órdenes Ejecutadas por Mes
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ordenesMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="cantidad"
                fill="#2563eb"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow p-6 h-80">
          <h3 className="text-xl font-semibold text-center mb-4">
            SIGAs Cerrados por Mes
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sigasMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="cantidad"
                fill="#2563eb"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* TENDENCIAS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "30px"
        }}
      >
        <div className="bg-white rounded-xl shadow p-6 h-80">
          <h3 className="text-xl font-semibold text-center mb-4">
            Tendencia Tiempo Órdenes
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={tiempoOrdenes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="dias"
                stroke="#22c55e"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow p-6 h-80">
          <h3 className="text-xl font-semibold text-center mb-4">
            Tendencia Tiempo SIGAs
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={tiempoSigas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="horas"
                stroke="#f59e0b"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* PRODUCTIVIDAD */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "30px",
          alignItems: "start",
        }}
      >

        {/* GRAFICO */}
        <div className="bg-white rounded-xl shadow p-6">
          
          <h3 className="text-xl font-semibold text-center">
            Productividad Total por Técnico
          </h3>

          <p
            style={{
              textAlign: "center",
              color: "#6b7280",
              marginBottom: "15px",
            }}
          >
            Comparativo de órdenes ejecutadas y SIGAs cerrados por técnico
          </p>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              layout="vertical"
              data={productividadTecnicos}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis type="number" />

              <YAxis
                type="category"
                dataKey="tecnico"
                width={100}
              />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="ordenes"
                name="Órdenes"
                fill="#2563eb"
                radius={[0, 6, 6, 0]}
              />

              <Bar
                dataKey="sigas"
                name="SIGAs"
                fill="#f59e0b"
                stroke="#92400e"
                strokeWidth={1}
                radius={[0, 6, 6, 0]}
              />

            </BarChart>
          </ResponsiveContainer>

        </div>

        {/* RESUMEN TECNICO */}
        <div className="bg-white rounded-xl shadow p-6">

          <h3 className="text-xl font-semibold mb-4">
            Desempeño del Técnico
          </h3>

          <div
            style={{
              maxWidth: "500px",
              margin: "0 auto",
              border: "1px solid #d1d5db",
              borderRadius: "12px",
              padding: "20px",
              backgroundColor: "#f9fafb",
            }}
          >

            <select
              value={tecnicoSeleccionado}
              onChange={(e) =>
                setTecnicoSeleccionado(e.target.value)
              }
              style={{
                marginBottom: "20px",
                padding: "6px",
              }}
            >
              {datosTecnicos.map((t) => (
                <option
                  key={t.nombre}
                  value={t.nombre}
                >
                  {t.nombre}
                </option>
              ))}
            </select>

            <div
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "12px",
                padding: "20px",
                backgroundColor: "#f9fafb",
              }}
            >

              <div
                style={{
                  textAlign: "center",
                  marginBottom: "20px",
                  fontSize: "22px",
                  fontWeight: "bold",
                }}
              >
                👤 {tecnico.nombre}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginBottom: "15px",
                }}
              >

                <div
                  style={{
                    backgroundColor: "#dbeafe",
                    borderRadius: "10px",
                    padding: "15px",
                    textAlign: "center",
                  }}
                >
                  <div>Órdenes</div>

                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: "bold",
                      backgroundColor: "#dbeafe",
                      color: "#2563eb",
                    }}
                  >
                    {tecnico.ordenes}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "#ede9fe",
                    borderRadius: "10px",
                    padding: "15px",
                    textAlign: "center",
                  }}
                >
                  <div>SIGAs</div>

                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: "bold",
                      backgroundColor: "#dbeafe",
                      color: "#ea580c",
                    }}
                  >
                    {tecnico.sigas}
                  </div>
                </div>

              </div>

              <div
                style={{
                  backgroundColor: "#dcfce7",
                  borderRadius: "10px",
                  padding: "15px",
                  textAlign: "center",
                  marginBottom: "15px",
                }}
              >
                <div>Total Gestionado</div>

                <div
                  style={{
                    fontSize: "34px",
                    fontWeight: "bold",
                    color: "#15803d",
                  }}
                >
                  {tecnico.total}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  padding: "15px",
                  marginBottom: "10px",
                  backgroundColor: "white",
                }}
              >
                <div
                  style={{
                    color: "#6b7280",
                    marginBottom: "5px",
                  }}
                >
                  ⏱ Tiempo Promedio Órdenes
                </div>

                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: "bold",
                  }}
                >
                  {tecnico.tiempoOrdenes}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  padding: "15px",
                  backgroundColor: "white",
                }}
              >
                <div
                  style={{
                    color: "#6b7280",
                    marginBottom: "5px",
                  }}
                >
                  ⚡ Tiempo Promedio SIGAs
                </div>

                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: "bold",
                  }}
                >
                  {tecnico.tiempoSigas}
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Reportes;