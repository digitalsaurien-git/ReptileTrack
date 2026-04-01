import { createContext, useContext, useEffect, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { supabase } from "../supabase";
import { initGoogleDrive, authenticateGoogle, saveToDrive } from "../utils/googleDrive";

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
  const [googleSyncEnabled, setGoogleSyncEnabled] = useLocalStorage("reptiltrack_google_sync", false);
  const [googleDriveReady, setGoogleDriveReady] = useState(false);
  const [lastSync, setLastSync] = useLocalStorage("reptiltrack_last_sync", null);
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

  // Initialisation Google Drive
  useEffect(() => {
    const init = async () => {
      try {
        await initGoogleDrive();
        setGoogleDriveReady(true);
        
        // Si la sync est activée, on essaie de charger les données
        if (localStorage.getItem('reptiltrack_google_sync') === 'true') {
          const driveData = await loadFromDrive();
          if (driveData && confirm("✨ Une sauvegarde plus récente a été trouvée sur votre Google Drive. Voulez-vous la charger ?")) {
            if (driveData.animals) setAnimals(driveData.animals);
            if (driveData.terrariums) setTerrariums(driveData.terrariums);
            if (driveData.equipments) setEquipments(driveData.equipments);
            if (driveData.foods) setFoods(driveData.foods);
            if (driveData.domotics) setDomotics(driveData.domotics);
            if (driveData.settings) setSettings(driveData.settings);
            setLastSync(new Date().toISOString());
          }
        }
      } catch (e) {
        console.error("Gdrive Init Error", e);
        setGoogleDriveReady(false);
      }
    };
    init();
  }, []);

  // Auto-Sync vers Google Drive
  useEffect(() => {
    const sync = async () => {
      if (googleSyncEnabled && googleDriveReady) {
        const data = { animals, terrariums, equipments, foods, domotics, settings, version: "2.9.1" };
        const success = await saveToDrive(data);
        if (success) setLastSync(new Date().toISOString());
      }
    };
    sync();
  }, [animals, terrariums, equipments, foods, domotics, googleSyncEnabled, googleDriveReady]);

  const connectGoogleDrive = async () => {
    try {
      console.log("🚀 Tentative de connexion Google Drive...");
      await authenticateGoogle();
      console.log("✅ Authentification réussie !");
      setGoogleSyncEnabled(true);
      localStorage.setItem('reptiltrack_google_sync', 'true');
      alert("✅ ReptileTrack est maintenant synchronisé avec votre Google Drive !");
    } catch (e) {
      console.error("❌ Échec d'authentification :", e);
      alert("❌ Échec de la connexion à Google Drive. Vérifiez que vous avez bien autorisé l'app dans la fenêtre Google.");
    }
  };

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

  // Fin de la logique Google Drive


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
    importData,
    googleSyncEnabled,
    connectGoogleDrive,
    googleDriveReady,
    lastSync
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
