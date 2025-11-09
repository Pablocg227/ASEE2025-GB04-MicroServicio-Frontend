import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProfilePage from './components/ProfilePage';
import './styles/App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta con parámetro email */}
        <Route path="/perfil/:email" element={<ProfilePage />} />
        
        {/* Redirección por defecto */}
        <Route path="/" element={<Navigate to="/perfil/prueba@gmail.com" replace />} />
        
        {/* 404 */}
        <Route path="*" element={<div>Página no encontrada</div>} />
      </Routes>
    </BrowserRouter>
  );
}