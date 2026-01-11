import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:4000", // backend server
  headers: { "Content-Type": "application/json" },
});

// Agent routes
export const runAgent = async (goal) => {
  const res = await axiosInstance.post("/agent/run", { goal });
  return res.data;
};

// Memory routes
export const getStateMemory = async () => {
  const res = await axiosInstance.get("/memory/state");
  return res.data;
};

export const getStepHistory = async () => {
  const res = await axiosInstance.get("/memory/steps");
  return res.data;
};

export const getMetrics = async () => {
  const res = await axiosInstance.get("/memory/metrics");
  return res.data;
};

// Health check
export const getHealth = async () => {
  const res = await axiosInstance.get("/health");
  return res.data;
};
