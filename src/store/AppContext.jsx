import { createContext, useContext, useEffect, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { supabase } from "../supabase";
import { initGoogleDrive, authenticateGoogle, saveToDrive, loadFromDrive } from "../utils/googleDrive";

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
    // Si l'URL contient un fragment (#) ou des paramètres de recherche (?), 
    // Supabase va tenter de récupérer la session automatiquement via getSession.

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log("✨ Session initiale détectée:", session.user.email);
          setUser(session.user);
        }
      } catch (err) {
        console.error("Erreur getSession:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for changes (magic link, social login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔔 Auth Event:", event);
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getRedirectUrl = () => {
    // window.location.origin est le plus fiable pour rediriger vers la même instance (local ou prod)
    return window.location.origin;
  };

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getRedirectUrl() }
    });
  };

  const loginWithEmail = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: getRedirectUrl() }
    });
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };
  const [cloudStatus, setCloudStatus] = useState('idle'); // 'idle', 'checking', 'conflict', 'sync_needed', 'synced'
  const [remoteData, setRemoteData] = useState(null);

  // --- DATA CLOUD SYNC ---
  const fetchData = async () => {
    if (!user || isGuest) return;
    setCloudStatus('checking');

    try {
      const [
        { data: anims },
        { data: terrs },
        { data: equs },
        { data: fds },
        { data: doms },
        { data: sets }
      ] = await Promise.all([
        supabase.from('rt_animals').select('*'),
        supabase.from('rt_terrariums').select('*'),
        supabase.from('rt_equipments').select('*'),
        supabase.from('rt_foods').select('*'),
        supabase.from('rt_domotics').select('*'),
        supabase.from('rt_settings').select('*').maybeSingle()
      ]);

      const hasRemoteData = (anims?.length > 0 || terrs?.length > 0 || equs?.length > 0 || fds?.length > 0 || doms?.length > 0);
      const hasLocalData = (animals.length > 0 || terrariums.length > 0 || equipments.length > 0 || foods.length > 0 || domotics.length > 0);

      setRemoteData({ anims, terrs, equs, fds, doms, sets });

      if (!hasRemoteData && hasLocalData) {
        setCloudStatus('sync_needed'); // Local présent, Cloud vide
      } else if (hasRemoteData && !hasLocalData) {
        // Cloud présent, Local vide -> Chargement auto car sans risque
        applyRemoteData({ anims, terrs, equs, fds, doms, sets });
        setCloudStatus('synced');
      } else if (hasRemoteData && hasLocalData) {
        // Conflit potentiel -> On demande à l'utilisateur
        setCloudStatus('conflict');
      } else {
        setCloudStatus('synced');
      }
    } catch (err) {
      console.error("Erreur de chargement Cloud:", err);
      setCloudStatus('idle');
    }
  };

  const applyRemoteData = (data) => {
    if (data.anims) {
      setAnimals(data.anims.map(a => ({
        ...a,
        commonName: a.common_name,
        scientificName: a.scientific_name,
        birthDate: a.birth_date,
        birthDateUnknown: a.birth_date_unknown,
        photoUrl: a.photo_url,
        citesStatus: a.cites_status,
        euStatus: a.eu_status,
        detentionRegime: a.detention_regime,
        sourceCode: a.source_code,
        citesNumber: a.cites_number,
        idMethod: a.id_method,
        idNumber: a.id_number,
        idLocation: a.id_location,
        legalNotes: a.legal_notes,
        entryDate: a.entry_date,
        entryNature: a.entry_nature,
        purchasePrice: a.purchase_price,
        sale_price: a.sale_price,
        entryJustification: a.entry_justification,
        terrariumId: a.terrarium_id,
        feedingFrequency: a.feeding_frequency,
        defaultFoodId: a.default_food_id,
        defaultFoodQuantity: a.default_food_quantity
      })));
    }
    if (data.terrs) {
      setTerrariums(data.terrs.map(t => ({
        ...t,
        purchasePrice: t.purchase_price,
        salePrice: t.sale_price
      })));
    }
    if (data.equs) {
      setEquipments(data.equs.map(e => ({
        ...e,
        purchasePrice: e.purchase_price,
        purchaseDate: e.purchase_date,
        watts: e.power_watts,
        hoursPerDay: e.hours_per_day,
        replacementFreq: e.replacement_freq,
        serialNumber: e.serial_number,
        terrariumId: e.terrarium_id
      })));
    }
    if (data.fds) {
      setFoods(data.fds.map(f => ({
        ...f,
        unitPrice: f.unit_price,
        alertThreshold: f.alert_threshold
      })));
    }
    if (data.doms) {
      setDomotics(data.doms.map(d => ({
        ...d,
        deviceId: d.device_id,
        ipAddress: d.ip_address,
        terrariumIds: d.terrarium_ids
      })));
    }
    if (data.sets) {
      setSettings({ ...settings, kwhPrice: data.sets.kwh_price });
      if (data.sets.theme) setTheme(data.sets.theme);
      if (data.sets.webhook_url) localStorage.setItem('reptiltrack_webhook_url', data.sets.webhook_url);
    }
  };


  const pushLocalToCloud = async () => {
    if (!user || isGuest) return;
    setCloudStatus('loading');
    
    console.log("🚀 Démarrage de la synchronisation Cloud...");
    console.log(`- Animaux détectés: ${animals.length}`);
    console.log(`- Terrariums détectés: ${terrariums.length}`);
    console.log(`- Équipements détectés: ${equipments.length}`);

    const mapAnimal = (a) => ({
      id: a.id,
      user_id: user.id,
      common_name: a.commonName,
      scientific_name: a.scientificName,
      family: a.family,
      subfamily: a.subfamily,
      nickname: a.nickname,
      sex: a.sex,
      birth_date: a.birthDate,
      birth_date_unknown: a.birthDateUnknown,
      mutation: a.mutation,
      photo_url: a.photoUrl,
      cites_status: a.citesStatus,
      eu_status: a.euStatus,
      detention_regime: a.detentionRegime,
      source_code: a.sourceCode,
      cites_number: a.citesNumber,
      id_method: a.idMethod,
      id_number: a.idNumber,
      id_location: a.idLocation,
      legal_notes: a.legalNotes,
      entry_date: a.entryDate,
      entry_nature: a.entryNature,
      origin: a.origin,
      provenance: a.provenance,
      purchase_price: a.purchasePrice,
      sale_price: a.salePrice,
      entry_justification: a.entryJustification,
      terrarium_id: a.terrariumId,
      feeding_frequency: a.feedingFrequency,
      default_food_id: a.defaultFoodId,
      default_food_quantity: a.defaultFoodQuantity,
      history: a.history || [],
      documents: a.documents || []
    });

    const mapTerrarium = (t) => ({
      id: t.id,
      user_id: user.id,
      name: t.name,
      brand: t.brand,
      dimensions: t.dimensions,
      location: t.location,
      purchase_price: t.purchasePrice,
      sale_price: t.salePrice,
      notes: t.notes
    });

    const mapEquipment = (e) => ({
      id: e.id,
      user_id: user.id,
      name: e.name,
      brand: e.brand,
      type: e.type,
      purchase_date: e.purchaseDate,
      power_watts: e.watts,
      purchase_price: e.purchasePrice,
      hours_per_day: e.hoursPerDay,
      replacement_freq: e.replacementFreq,
      serial_number: e.serialNumber,
      terrarium_id: e.terrariumId
    });

    const mapFood = (f) => {
      return {
        id: f.id,
        user_id: user.id,
        name: f.name,
        type: f.type,
        stock: f.stock,
        unit_price: f.unitPrice,
        alert_threshold: f.alertThreshold
      };
    };

    const mapDomotic = (d) => ({
      id: d.id,
      user_id: user.id,
      name: d.name,
      type: d.type,
      device_id: d.deviceId,
      ip_address: d.ipAddress,
      terrarium_ids: d.terrariumIds,
      status: d.status,
      settings: d.settings
    });

    if (animals.length > 0) console.log("📦 Payload premier animal:", mapAnimal(animals[0]));
    if (terrariums.length > 0) console.log("📦 Payload premier terrarium:", mapTerrarium(terrariums[0]));

    try {
      // Nettoyage Cloud existant
      await Promise.all([
        supabase.from('rt_animals').delete().eq('user_id', user.id),
        supabase.from('rt_terrariums').delete().eq('user_id', user.id),
        supabase.from('rt_equipments').delete().eq('user_id', user.id),
        supabase.from('rt_foods').delete().eq('user_id', user.id),
        supabase.from('rt_domotics').delete().eq('user_id', user.id)
      ]);

      // Upload groupé avec mapping
      const results = await Promise.all([
        animals.length > 0 ? supabase.from('rt_animals').insert(animals.map(mapAnimal)) : Promise.resolve({ error: null }),
        terrariums.length > 0 ? supabase.from('rt_terrariums').insert(terrariums.map(mapTerrarium)) : Promise.resolve({ error: null }),
        equipments.length > 0 ? supabase.from('rt_equipments').insert(equipments.map(mapEquipment)) : Promise.resolve({ error: null }),
        foods.length > 0 ? supabase.from('rt_foods').insert(foods.map(mapFood)) : Promise.resolve({ error: null }),
        domotics.length > 0 ? supabase.from('rt_domotics').insert(domotics.map(mapDomotic)) : Promise.resolve({ error: null }),
        supabase.from('rt_settings').upsert({
          user_id: user.id,
          kwh_price: settings.kwhPrice,
          theme: theme,
          webhook_url: localStorage.getItem('reptiltrack_webhook_url'),
          is_linked_with_cloud: true
        })
      ]);

      // Vérification des erreurs
      const firstError = results.find(r => r.error)?.error;
      if (firstError) {
        console.error("❌ Erreur Supabase détectée:", firstError);
        throw firstError;
      }

      console.log("✅ Synchronisation réussie !");
      setCloudStatus('synced');
      alert("✅ Données locales synchronisées sur le Cloud !");
    } catch (err) {
      console.error("❌ Échec de la synchronisation:", err);
      alert(`❌ Échec de la synchronisation: ${err.message || "Erreur inconnue"}`);
      setCloudStatus('conflict');
    }
  };


  const pullCloudToLocal = () => {
    if (remoteData) {
      applyRemoteData(remoteData);
      setCloudStatus('synced');
      alert("✅ Données Cloud récupérées avec succès !");
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Suppression des useEffect d'auto-sync silencieux



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
    saveWebhookUrl: (url) => {
      localStorage.setItem('reptiltrack_webhook_url', url);
      setSettings(prev => ({ ...prev, lastWebhookUpdate: Date.now() }));
    },
    cloudStatus,
    pushLocalToCloud,
    pullCloudToLocal,
    setGoogleSyncEnabled,
    googleSyncEnabled,
    connectGoogleDrive,
    googleDriveReady,
    lastSync,
    setLastSync
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
