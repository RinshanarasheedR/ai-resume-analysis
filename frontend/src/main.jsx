import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '10px',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '14px',
          fontWeight: '500',
        },
        success: {
          iconTheme: {
            primary: '#0284c7',
            secondary: '#fff',
          },
        },
        error: {
          duration: 5000,
        },
      }}
    />
  </React.StrictMode>
);
