import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Temporarily disable StrictMode in development to prevent duplicate API calls that trigger rate limiting
const isProduction = import.meta.env.PROD;

createRoot(document.getElementById('root')).render(
  isProduction ? (
    <StrictMode>
      <App />
    </StrictMode>
  ) : (
    <App />
  )
)
