import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Divisions from "./pages/navigate/Divisions";
import Events from "./pages/navigate/Events";
import FighterProfile from "./pages/FighterProfile";
import Fighters from "./pages/navigate/Fighters";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import FighterDashboard from "./pages/dashboard/FighterDashboard";
import SponsorDashboard from "./pages/dashboard/SponsorDashboard";
import RoleSelectionPage from "./pages/auth/RoleSelectionPage";
import { useAuthStore } from "./stores/authStore";
import Sponsors from "./pages/navigate/Sponsors";
import FighterEdit from "./pages/edit/FighterEdit";
import SponsorEdit from "./pages/edit/SponsorEdit";
import DonorDashboard from "./pages/dashboard/DonorDashboard";
import DonorEdit from "./pages/edit/DonorEdit";
import MessagesPage from "./pages/MessagesPage";
import EditEvent from "./pages/edit/EditEvent";
import CreateEvent from "./pages/CreateEvent";
import EventDetails from "./pages/EventDetails";

const queryClient = new QueryClient();

const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, []);

  return <>{children}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppInitializer>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/fighters" element={<Fighters />} />
              <Route path="/fighter/:id" element={<FighterProfile />} />
              <Route path="/divisions" element={<Divisions />} />
              <Route path="/events" element={<Events />} />
              <Route path="/sponsors" element={<Sponsors />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />

              {/* Dashboards */}
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route path="/dashboard/fighter" element={<FighterDashboard />} />
              <Route path="/dashboard/sponsor" element={<SponsorDashboard />} />
              <Route path="/dashboard/donor" element={<DonorDashboard />} />
              <Route path="/dashboard/guest" element={<RoleSelectionPage />} />

              {/* Edit */}
              <Route path="/dashboard/fighter/edit" element={<FighterEdit />} />
              <Route path="/dashboard/sponsor/edit" element={<SponsorEdit />} />
              <Route path="/dashboard/donor/edit" element={<DonorEdit />} />
              <Route path="/events/edit/:id" element={<EditEvent />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />

              {/* Chat */}
              <Route path="/dashboard/messages" element={<MessagesPage />} />

              {/* Create */}
              <Route path="/events/create" element={<CreateEvent />} />

              <Route path="/events/:id" element={<EventDetails />} />
            </Routes>
          </AppInitializer>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
