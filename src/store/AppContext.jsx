import { createContext, useContext, useEffect, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { supabase } from "../supabase";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useLocalStorage("reptiltrack_is_guest", false);

  const [animals, setAnimals] = useLocalStorage("reptiltrack_animals", []);
  const [terrariums, setTerrariums] = useLocalStorage("reptiltrack_terrariums", []);
  const [equipments, setEquipments] = useLocalStorage("reptiltrack_equipments", []);
  const [foods, setFoods] = useLocalStorage("reptiltrack_foods", []);
  const [domotics, setDomotics] = useLocalStorage("reptiltrack_domotics", []);
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
    const redirectUrl = window.location.hostname === 'localhost' 
      ? window.location.origin 
      : 'https://repitle-track.vercel.app';
    
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl }
    });
  };

  const loginWithEmail = async (email) => {
    // On privilégie l'URL de production exacte fournie par l'utilisateur
    const redirectUrl = window.location.hostname === 'localhost' 
      ? window.location.origin 
      : 'https://repitle-track.vercel.app';
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectUrl }
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

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem('reptiltrack_is_guest');
    // On force le rechargement complet à la racine pour être sûr de retomber sur le Login
    window.location.href = window.location.origin;
  };

  const exportData = () => {
    const data = {
      animals,
      terrariums,
      equipments,
      foods,
      domotics,
      settings,
      exportDate: new Date().toISOString(),
      version: "2.9.1"
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reptiletrack_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.animals) setAnimals(data.animals);
      if (data.terrariums) setTerrariums(data.terrariums);
      if (data.equipments) setEquipments(data.equipments);
      if (data.foods) setFoods(data.foods);
      if (data.domotics) setDomotics(data.domotics);
      if (data.settings) setSettings(data.settings);
      
      alert("✅ Restauration réussie ! Vos données ont été mises à jour.");
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      alert("❌ Erreur lors de l'importation. Le fichier est peut-être corrompu.");
    }
  };

  const value = {
    user,
    setUser,
    isGuest,
    setIsGuest,
    animals,
    setAnimals,
    terrariums,
    setTerrariums,
    equipments,
    setEquipments,
    foods,
    setFoods,
    domotics,
    setDomotics,
    settings,
    setSettings,
    theme,
    toggleTheme,
    signOut,
    loginWithGoogle,
    loginWithEmail,
    exportData,
    importData
  };

  return (
    <AppContext.Provider value={value}>
      {!loading && children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
