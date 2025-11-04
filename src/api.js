import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

const isDevelopment = import.meta.env.MODE === 'development';
const baseURL = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_DEPLOY;
console.log(isDevelopment ? "Using Local API URL" : "Using Deployed API URL");

const api = axios.create({
    baseURL: baseURL
})

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)

export default api