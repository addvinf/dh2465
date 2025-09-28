import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Header } from "../components/Header";

const FrontPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className="min-h-screen flex flex-col justify-center items-center">
        <h1 className="text-9xl font-bold m-20">FRONT PAGE</h1>
        <p className="text-xl mb-4">Slask pages:</p>
        {/* <button
      className="px-8 py-4 text-lg transition-colors"
      onClick={() => navigate("/admin")}
    >
      Admin Page
    </button> */}
        <Button
          className="px-10 py-4 text-lg"
          onClick={() => navigate("/admin")}
        >
          Admin Page
        </Button>
        <Button
          className="px-10 py-4 text-lg mt-4"
          onClick={() => navigate("/404")}
        >
          404 Page
        </Button>

        {/* Add a color scheme viewer, showing bg, fg, primary, secondary, etc. */}
        <div className="m-10 p-6 bg-card border border-border rounded-lg shadow-md w-full max-w-4xl">
          <h2 className="text-2xl font-semibold mb-4">Color Scheme</h2>
          <div className="grid grid-cols-8 gap-4">
            {[
              "background",
              "foreground",
              "muted",
              "muted-foreground",
              "popover",
              "popover-foreground",
              "card",
              "card-foreground",
              "primary",
              "primary-foreground",
              "secondary",
              "secondary-foreground",
              "secondary-muted",
              "accent",
              "accent-foreground",
              "border",
              "input",
              "ring",
            ].map((color) => (
              <div key={color} className="flex flex-col items-center">
                <div
                  className="w-16 h-16 rounded mb-2 border border-border"
                  style={{ background: `hsl(var(--${color}))` }}
                ></div>
                <span className="text-sm text-center">{color}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default FrontPage;
