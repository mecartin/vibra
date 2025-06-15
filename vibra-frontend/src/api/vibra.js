import axios from "axios";
const BASE = import.meta.env.VITE_API_BASE;

export async function analyzeMood(input) {
  return axios.post(`${BASE}/mood/analyze`, { input });
}
export async function getGifs(mood) {
  return axios.get(`${BASE}/content/gif/${mood}`);
}
export async function getQuote(mood) {
  return axios.get(`${BASE}/content/quote/${mood}`);
}