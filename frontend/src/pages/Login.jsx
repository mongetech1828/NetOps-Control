import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {

    try {
      setErrorLogin("");
      setLoading(true);

      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        setErrorLogin(
          "Correo o contraseña incorrectos"
        );

        return;
      }

    } catch (error) {
      setErrorLogin(
        "Ocurrió un error al iniciar sesión"
      );

    } finally {
      setLoading(false);
    }
  }

  return (

    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "linear-gradient(135deg, #0f172a, #1e3a8a)"
      }}
    >

      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "16px",
          width: "380px",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.25)",
          textAlign: "center"
        }}
      >

        <div
          style={{
            fontSize: "50px",
            marginBottom: "10px"
          }}
        >
          🛠️
        </div>

        <h1
          style={{
            marginBottom: "5px",
            color: "#1e3a8a"
          }}
        >
          NetOps Control
        </h1>

        <br/>

        <p
          style={{
            color: "#6b7280",
            marginBottom: "30px"
          }}
        >
          Gestión Servicios Especializados
        </p>

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            boxSizing: "border-box"
          }}
        />

        <input
          type={
            mostrarPassword
              ? "text"
              : "password"
          }
          placeholder="Contraseña"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleLogin();
            }
          }}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            boxSizing: "border-box"
          }}
        />

        {
          errorLogin && (

            <div
              style={{
                color: "#dc2626",
                marginBottom: "15px",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              ❌ {errorLogin}
            </div>

          )
        }

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "20px"
          }}
        >

          <input
            type="checkbox"
            checked={mostrarPassword}
            onChange={(e) =>
              setMostrarPassword(
                e.target.checked
              )
            }
          />

          <label>
            Mostrar contraseña
          </label>

        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            background: loading
              ? "#93c5fd"
              : "#2563eb",
            color: "white",
            fontWeight: "600",
            cursor: loading
              ? "not-allowed"
              : "pointer",
            fontSize: "15px",
            opacity: loading ? 0.8 : 1
          }}
        >
          {loading
            ? "Ingresando..."
            : "Ingresar"}
        </button>

        <p
          style={{
            marginTop: "20px",
            fontSize: "12px",
            color: "#9ca3af"
          }}
        >
          NetOps Control v1.0
        </p>

      </div>

    </div>

  );
}

export default Login;