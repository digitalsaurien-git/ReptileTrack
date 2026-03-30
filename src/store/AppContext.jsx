import { createContext, useContext, useEffect, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { supabase } from "../supabase";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [animals, setAnimals] = useLocalStorage("reptiltrack_animals", []);
  const [terrariums, setTerrariums] = useLocalStorage("reptiltrack_terrariums", []);
  const [equipments, setEquipments] = useLocalStorage("reptiltrack_equipments", []);
  const [foods, setFoods] = useLocalStorage("reptiltrack_foods", []);
  const [settings, setSettings] = useLocalStorage("reptiltrack_settings", { kwhPrice: 0.25 });
  const [theme, setTheme] = useLocalStorage("reptiltrack_theme", "dark");

  // --- AUTH LOGIC ---
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const loginWithEmail = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // --- DATA CLOUD SYNC ---
  const fetchData = async () => {
    if (!user) return;

    try {
      const [
        { data: anims },
        { data: terrs },
        { data: equs },
        { data: fds }
      ] = await Promise.all([
        supabase.from('animals').select('*'),
        supabase.from('terrariums').select('*'),
        supabase.from('equipments').select('*'),
        supabase.from('foods').select('*')
      ]);

      if (anims) setAnimals(anims);
      if (terrs) setTerrariums(terrs);
      if (equs) setEquipments(equs);
      if (fds) setFoods(fds);
    } catch (err) {
      console.error("Erreur de chargement Cloud:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    if (newTheme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  };

  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  }, [theme]);

  return (
    <AppContext.Provider value={{
      user, loading,
      loginWithGoogle, loginWithEmail, logout,
      animals, setAnimals,
      terrariums, setTerrariums,
      equipments, setEquipments,
      foods, setFoods,
      settings, setSettings,
      theme, toggleTheme
    }}>
      {!loading && children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
