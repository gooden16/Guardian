// Export shared constants
export const PROCESS = {
  env: {
    NODE_ENV: import.meta.env.MODE,
    MONGODB_URI: import.meta.env.VITE_MONGODB_URI,
    MONGODB_USER: import.meta.env.VITE_MONGODB_USER,
    MONGODB_PASSWORD: import.meta.env.VITE_MONGODB_PASSWORD
  }
};