import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // o tu URL de API
  // Puedes configurar headers comunes, interceptors para token, errores, etc.
});



export default apiClient;
