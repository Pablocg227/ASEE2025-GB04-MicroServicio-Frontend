import React, { useState, useEffect } from 'react';
import { fetchArtistAlbums, fetchArtistSongs, getArtistEmailFromToken } from './services/api';
import AlbumList from './components/AlbumList';
import SongList from './components/SongList';
import './styles/App.css';

function App() {
  const [albums, setAlbums] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [artistEmail, setArtistEmail] = useState(null);
  const [activeTab, setActiveTab] = useState('albums'); // 'albums' o 'songs'

  useEffect(() => {
    const email = getArtistEmailFromToken();
    if (email) {
      setArtistEmail(email);
      loadData(email);
    } else {
      setLoading(false);
      alert('No se encontró el token de autenticación');
      window.location.href = '/login.html';
    }
  }, []);

  const loadData = async (email) => {
    try {
      setLoading(true);
      const [albumsData, songsData] = await Promise.all([
        fetchArtistAlbums(email),
        fetchArtistSongs(email)
      ]);
      setAlbums(albumsData);
      setSongs(songsData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error al cargar los datos del artista');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    if (artistEmail) {
      loadData(artistEmail);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    window.location.href = '/login.html';
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>Gestión de Contenido Musical</h1>
        <div className="header-info">
          <span>Artista: {artistEmail}</span>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'albums' ? 'active' : ''}`}
          onClick={() => setActiveTab('albums')}
        >
          Mis Álbumes ({albums.length})
        </button>
        <button 
          className={`tab ${activeTab === 'songs' ? 'active' : ''}`}
          onClick={() => setActiveTab('songs')}
        >
          Mis Canciones ({songs.length})
        </button>
      </div>

      <div className="main-content">
        {activeTab === 'albums' ? (
          <AlbumList 
            albums={albums} 
            onUpdate={handleUpdate}
          />
        ) : (
          <SongList 
            songs={songs} 
            onUpdate={handleUpdate}
            showAlbumColumn={true}
          />
        )}
      </div>
    </div>
  );
}

export default App;