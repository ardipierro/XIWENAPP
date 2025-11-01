import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './globals.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { ViewAsProvider } from './contexts/ViewAsContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ViewAsProvider>
        <App />
      </ViewAsProvider>
    </ThemeProvider>
  </React.StrictMode>,
)