import { useEffect, useState } from "react";
import { supabase } from "./services/supabase";
import Login from "./pages/Login";
import AppRoutes from "./routes/AppRoutes";

function App() {

  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
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

        setLoadingSession(false);        
      });       
     
    const {data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        
        setSession(session);

        if (session?.user?.id) {
          cargarPerfil(session.user.id);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };

  }, []);

  async function cerrarSesion() {
    await supabase.auth.signOut();
  }

  if (loadingSession) {
    return <div>Cargando...</div>;
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