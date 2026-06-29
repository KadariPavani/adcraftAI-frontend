import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import GenerateDescription from "./pages/GenerateDescription";
import GenerateCampaign from "./pages/GenerateCampaign";
import Catalog from "./pages/Catalog";
import History from "./pages/History";
import ProductLink from "./pages/ProductLink";
import CollectionLink from "./pages/CollectionLink";
import SocialDashboard from "./pages/SocialDashboard";
import SchedulePost from "./pages/SchedulePost";
import PostDetail from "./pages/PostDetail";
import SocialSettings from "./pages/SocialSettings";
import VoiceMode from "./pages/VoiceMode";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import EcommerceListing from "./pages/EcommerceListing";
import LinkAnalytics from "./pages/LinkAnalytics";
import ProductDetail from "./pages/ProductDetail";
import { RouteTracker } from "./components/RouteTracker";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RouteTracker />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/generate/description" element={<GenerateDescription />} />
          <Route path="/generate/campaign" element={<GenerateCampaign />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/history" element={<History />} />
          <Route path="/social/dashboard" element={<SocialDashboard />} />
          <Route path="/social/schedule" element={<SchedulePost />} />
          <Route path="/social/post/:id" element={<PostDetail />} />
          <Route path="/social/settings" element={<SocialSettings />} />
          <Route path="/voice" element={<VoiceMode />} />
          <Route path="/__a/:slug" element={<AnalyticsDashboard />} />
          <Route path="/analytics" element={<LinkAnalytics />} />
          <Route path="/ecommerce" element={<EcommerceListing />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/p/:slug" element={<ProductLink />} />
          <Route path="/c/:slug" element={<CollectionLink />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
