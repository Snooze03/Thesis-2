import axios from "axios";

const apiNinjas = axios.create({
    baseURL: "https://api.api-ninjas.com/v1/",
    headers: {
        "X-Api-Key": import.meta.env.VITE_API_NINJAS_KEY
    }
});

export default apiNinjas;
