import axios, { AxiosInstance } from 'axios'

/**
 * Axios instance pre-configured to interact with the backend API.
 * 
 * The Authorization token is dynamically injected by a request interceptor,
 * using a callback setter provided externally (from your auth context).
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

/**
 * Function used to retrieve the current access token.
 * Must be registered via `setTokenGetter` before making authenticated requests.
 */
let tokenGetter: (() => Promise<string | null>) | null = null

/**
 * Registers a function to retrieve the latest access token.
 * This should be called once, usually in your top-level component after auth is ready.
 * 
 * @param getter - A function that returns a Promise resolving to a Bearer token string.
 */
export function setTokenGetter(getter: () => Promise<string | null>): void {
  tokenGetter = getter
}

// Intercept every request and attach the token if available
apiClient.interceptors.request.use(
  async (config) => {
    if (tokenGetter) {
      try {
        const token = await tokenGetter()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (err) {
        console.warn('Failed to attach token:', err)
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default apiClient
