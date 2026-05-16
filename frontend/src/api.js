// frontend/src/api.js — API client for communicating with the backend

//const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
//const BASE_URL = import.meta.env.VITE_API_URL || "/api";
//const BASE_URL = import.meta.env.VITE_API_URL || "";
const BASE_URL = import.meta.env.VITE_API_URL || "";

/**
 * Fetch all articles, optionally paginated
 * @param {object} params
 * @param {number} [params.page=1]
 * @param {number} [params.limit=100]
 * @returns {Promise<object>}
 */
export async function fetchNews({ page = 1, limit = 100 } = {}) {
  const res = await fetch(`${BASE_URL}/api/news?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

/**
 * Fetch articles filtered by group
 * @param {string} group - "TAMANNA" | "AI Labs" | "Publications"
 * @returns {Promise<object>}
 */
export async function fetchNewsByGroup(group) {
  const res = await fetch(`${BASE_URL}/api/news/${encodeURIComponent(group)}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

/**
 * Fetch articles filtered by source name
 * @param {string} name
 * @returns {Promise<object>}
 */
export async function fetchNewsBySource(name) {
  const res = await fetch(`${BASE_URL}/api/source/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

/**
 * Trigger a manual refresh on the backend
 * @returns {Promise<object>}
 */
export async function triggerRefresh() {
  const res = await fetch(`${BASE_URL}/api/refresh`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

/**
 * Fetch all source statuses
 * @returns {Promise<object>}
 */
export async function fetchSources() {
  const res = await fetch(`${BASE_URL}/api/sources`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

/**
 * Fetch backend health status
 * @returns {Promise<object>}
 */
export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/api/health`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
