import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Sparkles, Compass } from "lucide-react";
import { GradientText } from "@/components/ui/premium";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-6">
      <div aria-hidden className="absolute inset-0 bg-gradient-mesh opacity-70" />
      <div aria-hidden className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-primary/25 blur-3xl animate-blob" />
      <div aria-hidden className="absolute -bottom-40 -left-32 w-[28rem] h-[28rem] rounded-full bg-tertiary/20 blur-3xl animate-blob [animation-delay:4s]" />
      <div aria-hidden className="absolute inset-0 bg-block-print opacity-40" />

      <div className="relative max-w-md w-full text-center animate-fade-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-marigold shadow-elevated mb-7 animate-float">
          <Compass className="w-10 h-10 text-primary-foreground" />
        </div>

        <p className="text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">404 · Lost the trail</p>
        <h1 className="font-display text-6xl md:text-7xl font-bold leading-none mb-4">
          <GradientText animated>Page not found</GradientText>
        </h1>
        <p className="text-muted-foreground text-lg max-w-sm mx-auto">
          The page <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted">{location.pathname}</span> doesn't exist —
          or it took an unannounced trip.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="gradient" size="lg" className="sheen">
            <Link to="/"><Home className="w-4 h-4" /> Back to Home</Link>
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" /> Go back
          </Button>
        </div>

        <p className="mt-10 inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> AdCraft AI
        </p>
      </div>
    </div>
  );
};

export default NotFound;
