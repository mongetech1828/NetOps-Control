import { useState } from "react";
import { supabase } from "../services/supabase";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    console.log("USER");
    console.log(data);

    console.log("ERROR");
    console.log(error);
  }

  return (
    <div>

      <h2>NetOps Control</h2>

      <input
        type="email"
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br />
      <br />

      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br />
      <br />

      <button onClick={handleLogin}>
        Ingresar
      </button>

    </div>
  );
}

export default Login;