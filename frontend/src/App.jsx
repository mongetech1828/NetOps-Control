import { useEffect, useState } from "react";
import { supabase } from "./services/supabase";
import Login from "./pages/Login";

function App() {

  const [session, setSession] = useState(null);

  useEffect(() => {

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      });

    const {
      data: listener
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };

  }, []);

  if (!session) {
    return <Login />;
  }

  return (
    <div>
      <h1>NetOps Control</h1>

      <h3>
        Usuario Autenticado
      </h3>

      <p>
        {session.user.email}
      </p>

      <br />
      <br />

      <button
        onClick={async() => {
          await supabase.auth.signOut();
        }}
      >
        Cerrar Sesión
      </button>
    </div>
  );
}

export default App;