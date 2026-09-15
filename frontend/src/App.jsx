import { useEffect, useState } from "react";
import { supabase } from "./services/supabase";
import Login from "./pages/Login";
import AppRoutes from "./routes/AppRoutes";

function App() {

  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {

     async function cargarPerfil(userId) {

        const { data } = await supabase
          .from("perfiles")
          .select("*")
          .eq("id", userId)
          .single();

        setPerfil(data);
      }

    supabase.auth.getSession()
      .then(({ data: { session } }) => {

        setSession(session);

        if (session?.user?.id) {
          cargarPerfil(session.user.id);
        }
      });

     
    const {
      data: listener
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        
        setSession(session);

        if (session?.user?.id) {
          cargarPerfil(session.user.id);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };

  }, []);

  async function cerrarSesion() {
    await supabase.auth.signOut();
  }

  if (!session) {
    return <Login />;
  }

  return (
    <AppRoutes
    perfil={perfil}
    onLogout={cerrarSesion}
   />
  );

}

export default App;