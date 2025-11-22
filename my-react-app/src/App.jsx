import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProfilePage from './components/ProfilePage';
import MusicPage from './components/Music/MusicPage';
import './styles/App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/perfil/:email" element={<ProfilePage />} />
        <Route path="/musica" element={<MusicPage />} />
        
        {/* Redirección por defecto a música */}
        <Route path="/" element={<Navigate to="/musica" replace />} />
        
        <Route path="*" element={<div>Página no encontrada</div>} />
      </Routes>
    </BrowserRouter>
  );
}