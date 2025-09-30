import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "../components/ui/Button";
import { Home } from "lucide-react";
import { Header } from "../components/Header";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      <Header />
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <h1 className="text-9xl font-bold text-secondary">404 :(</h1>
          <h2 className="text-2xl font-semibold text-foreground">
            Sidan hittades inte
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Den sida du söker verkar inte existera. Kontrollera webbadressen
            eller gå tillbaka till startsidan.
          </p>
          <Button asChild className="mx-auto">
            <a href="/">
              <Home className="mr-2 h-4 w-4" />
              Tillbaka till startsidan
            </a>
          </Button>
        </div>
      </div>
    </>
  );
};

export default NotFound;
