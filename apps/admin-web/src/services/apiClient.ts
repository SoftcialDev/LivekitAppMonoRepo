/*
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // o tu URL de API
  // Puedes configurar headers comunes, interceptors para token, errores, etc.
});

// Ejemplo de interceptor para añadir token de auth si lo usas:
apiClient.interceptors.request.use((config) => {
  // Obtener token de tu contexto o localStorage si aplica
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

export default apiClient;
*/