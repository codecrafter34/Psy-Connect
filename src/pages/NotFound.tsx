import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">404</h1>
          <p className="text-xl text-muted-foreground">Oops! Page not found</p>
          <a href="/" className="inline-block bg-gradient-hero text-white px-6 py-2 rounded-lg hover:shadow-medium transition-all duration-300">
            Return to Home
          </a>
        </div>
      </div>
    );
};

export default NotFound;
