import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./store/AppContext";
import { Layout } from "./components/Layout";

// Vues
import { Dashboard } from "./pages/Dashboard";
import { Animals } from "./pages/Animals";
import { AnimalDetail } from "./pages/AnimalDetail";
import { Terrariums } from "./pages/Terrariums";
import { Equipments } from "./pages/Equipments";
import { Finances } from "./pages/Finances";

function App() {
  return (
    <AppProvider>
      <BrowserRouter basename="/ReptileTrack/">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="animals" element={<Animals />} />
            <Route path="animals/:id" element={<AnimalDetail />} />
            <Route path="terrariums" element={<Terrariums />} />
            <Route path="equipments" element={<Equipments />} />
            <Route path="finances" element={<Finances />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
