import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Ghost, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-4">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      <div
        className="relative z-10 max-w-md w-full animate-in fade-in slide-in-from-bottom-10 duration-700 flex flex-col items-center"
      >
        {/* Logo */}
        <img
          src="/autoform-logo.png"
          alt="AutoForm Logo"
          className="h-12 w-auto mb-8 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
        />

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl text-center w-full">
          <div
            className="mb-6 flex justify-center animate-in zoom-in-50 duration-700 delay-200 fill-mode-both"
          >
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
              <Ghost className="h-12 w-12 text-blue-400" />
            </div>
          </div>

          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">
            Page Not Found
          </h1>

          <p className="text-gray-400 mb-8 leading-relaxed">
            The page you are looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>

          <Button
            onClick={() => navigate("/")}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white border-0 shadow-lg shadow-blue-500/20 transition-all duration-300 transform hover:scale-[1.02]"
            size="lg"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Home
          </Button>
        </div>

        <p className="mt-8 text-center text-xs text-gray-600">
          Error Code: 404 • {location.pathname}
        </p>
      </div>
    </div>
  );
};

export default NotFound;
