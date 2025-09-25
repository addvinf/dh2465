import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

const FrontPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <h1 className="text-9xl font-bold mb-4">FRONT PAGE</h1>
      <p className="text-xl mb-8">Visit pages:</p>
      {/* <button
        className="px-8 py-4 text-lg transition-colors"
        onClick={() => navigate("/admin")}
      >
        Admin Page
      </button> */}
      <Button className="px-10 py-4 text-lg" onClick={() => navigate("/admin")}>
        Admin Page
      </Button>
    </div>
  );
};

export default FrontPage;
