import { Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout";
import { SplashScreen, TourOverlay } from "@/components/tutorial";
import { useTutorialStore } from "@/stores/tutorialStore";
import DashboardPage from "@/pages/DashboardPage";
import EnergyFlowPage from "@/pages/EnergyFlowPage";
import MaterialFlowPage from "@/pages/MaterialFlowPage";
import SymbiosisDiscoveryPage from "@/pages/SymbiosisDiscoveryPage";
import BusinessCasePage from "@/pages/BusinessCasePage";
import GISMapPage from "@/pages/GISMapPage";
import AIChatPage from "@/pages/AIChatPage";
import ProjectDataPage from "@/pages/ProjectDataPage";
import ScenarioLabPage from "@/pages/ScenarioLabPage";

function App() {
  const { splashCompleted, tourActive, completeSplash, startTour } =
    useTutorialStore();

  return (
    <>
      <SplashScreen
        isVisible={!splashCompleted}
        onComplete={() => {
          completeSplash();
          startTour();
        }}
        onSkip={() => {
          completeSplash();
        }}
      />
      {tourActive && <TourOverlay />}
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/energi" element={<EnergyFlowPage />} />
          <Route path="/materialstrom" element={<MaterialFlowPage />} />
          <Route path="/symbiose" element={<SymbiosisDiscoveryPage />} />
          <Route path="/forretningscase" element={<BusinessCasePage />} />
          <Route path="/kart" element={<GISMapPage />} />
          <Route path="/prosjektdata" element={<ProjectDataPage />} />
          <Route path="/ki-ekspert" element={<AIChatPage />} />
          <Route path="/scenarier" element={<ScenarioLabPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
