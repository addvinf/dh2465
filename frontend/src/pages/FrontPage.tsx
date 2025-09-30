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

        <div className="relative w-full max-w-7xl mx-8 my-10">
          <img
            src="/src/assets/joshua-slate-HN9O6R5wUUc-unsplash.jpg"
            alt="Demo background"
            className="rounded-2xl w-full object-cover h-[30rem] brightness-90"
          />
          <div className="absolute top-1/2 left-1/2 frosted-box flex items-center justify-center">
            <div className="p-8 flex flex-col items-center max-w-md">
              <h2 className="text-4xl font-bold text-white mb-4">Demo Page</h2>
              <p className="text-sm  text-white text-center">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                euismod
              </p>
            </div>
          </div>
        </div>
        <p className="text-xl mb-4">Slask pages:</p>
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
