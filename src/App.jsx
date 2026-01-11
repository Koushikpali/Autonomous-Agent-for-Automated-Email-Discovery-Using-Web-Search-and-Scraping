import "./App.css";

import React from "react";
import RunAgentForm from "./components/RunAgentForm";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-xl w-full">
        <h2 className="text-2xl font-bold text-center mb-6">Agent Dashboard</h2>
        <RunAgentForm />
      </div>
    </div>
  );
}

export default App;
