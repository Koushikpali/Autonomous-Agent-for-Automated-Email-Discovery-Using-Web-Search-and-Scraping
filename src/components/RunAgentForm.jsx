import React, { useState } from "react";
import { runAgent } from "../api/apiClient";
import Loading from "./Loading";

export default function RunAgentForm() {
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    if (!goal.trim()) return;

    try {
      setLoading(true);
      setResult(null);

      const res = await runAgent(goal);
      setResult(res);
    } catch (err) {
      console.error("Error running agent:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Running agent..." />;
  }

  return (
    <div className="p-6 bg-white shadow rounded-md">
      <h3 className="text-xl font-semibold mb-4">Run Agent</h3>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-3 py-2"
        />
        <button
          onClick={handleRun}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Run
        </button>
      </div>

      {result && (
        <div className="mt-6">
          <h4 className="text-lg font-medium mb-2">Run Summary</h4>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Run ID:</strong> {result.run_id}
            </li>
            <li>
              <strong>Goal:</strong> {result.goal}
            </li>
            <li>
              <strong>Known URLs:</strong>
              <ul className="list-disc list-inside ml-6">
                {result.state?.known_urls?.map((url, i) => (
                  <li key={i}>{url}</li>
                ))}
              </ul>
            </li>
            <li>
              <strong>Contact Methods:</strong>
              <ul className="list-disc list-inside ml-6">
                {result.state?.contact_methods?.map((email, i) => (
                  <li key={i}>{email}</li>
                ))}
              </ul>
            </li>
            <li>
              <strong>Steps:</strong>
              <ul className="list-decimal list-inside ml-6">
                {result.steps?.map((step, i) => (
                  <li key={i}>
                    <span className="font-semibold">{step.action}</span> →{" "}
                    {step.target}
                  </li>
                ))}
              </ul>
            </li>
            <li>
              <strong>Metrics:</strong>
              <ul className="list-disc list-inside ml-6">
                <li>Searches: {result.metrics?.counters?.searches}</li>
                <li>Scrapes: {result.metrics?.counters?.scrapes}</li>
                <li>
                  Useful Results: {result.metrics?.counters?.useful_results}
                </li>
                <li>Discovery Rate: {result.metrics?.rates?.discovery_rate}</li>
                <li>Yield Rate: {result.metrics?.rates?.yield_rate}</li>
              </ul>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
