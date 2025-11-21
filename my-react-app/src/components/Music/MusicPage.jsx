import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
// NOTA: Hemos ajustado la ruta para salir de 'Music', salir de 'components' e ir a 'services'
import {
  fetchArtistAlbums,
  fetchArtistSongs,
  getArtistEmailFromToken,
} from "../../services/musicApi";

// NOTA: Como MusicPage está en la misma carpeta que estos componentes, el import es directo "./"
import AlbumList from "./AlbumList";
import SongList from "./SongList";
import PublicCatalog from "./PublicCatalog";
import PublicSongDetail from "./PublicSongDetail";
import PublicAlbumCatalog from "./PublicAlbumCatalog";
import PublicAlbumDetail from "./PublicAlbumDetail";

// NOTA: Ajustamos la ruta de los estilos (subir 2 niveles)
import "../../styles/MusicGlobal.css";

function MusicPage() {
  const [albums, setAlbums] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [artistEmail, setArtistEmail] = useState(null);
  const [activeTab, setActiveTab] = useState("albums");

  const [viewMode, setViewMode] = useState("catalog");
  const [selectedSongId, setSelectedSongId] = useState(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [isListenerLoggedIn, setIsListenerLoggedIn] = useState(false);

  // --- NUEVO: Estado para guardar el email del usuario actual (sea artista o oyente) ---
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const storedUserType = localStorage.getItem("userType");

    if (token) {
      const emailFromToken = getArtistEmailFromToken(); // Esta función ya la tienes importada
      if (emailFromToken) {
        setCurrentUserEmail(emailFromToken);
      }
    }

    if (token && storedUserType === "artist") {
      const email = getArtistEmailFromToken();
      if (email) {
        setArtistEmail(email);
        setViewMode("artist");
        loadData(email);
        return;
      }
    }

    if (token && storedUserType === "user") {
      setIsListenerLoggedIn(true);
    } else {
      setIsListenerLoggedIn(false);
    }

    setViewMode("catalog");
    setLoading(false);
  }, []);

  const loadData = async (email) => {
    try {
      setLoading(true);
      const [albumsData, songsData] = await Promise.all([
        fetchArtistAlbums(email),
        fetchArtistSongs(email),
      ]);
      setAlbums(albumsData);
      setSongs(songsData);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Error al cargar los datos del artista");
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
    localStorage.removeItem("authToken");
    localStorage.removeItem("tokenType");
    localStorage.removeItem("userType");
    localStorage.removeItem("userData");

    setArtistEmail(null);
    setIsListenerLoggedIn(false);
    setAlbums([]);
    setSongs([]);
    setActiveTab("albums");
    setViewMode("catalog");
    setSelectedSongId(null);
    setSelectedAlbumId(null);
    setLoading(false);
  };

  const handleLoginClick = () => {
    // OJO: Esto asume que tienes un login.html en la carpeta 'public'.
    // Si vas a unificar el login más adelante, esto habrá que cambiarlo.
    window.location.href = "/login.html";
  };

  const handleSelectSong = (songId) => {
    setSelectedSongId(songId);
    setViewMode("song");
  };

  const handleBackToSongCatalog = () => {
    setSelectedSongId(null);
    setViewMode("catalog");
  };

  const handleSelectAlbum = (albumId) => {
    setSelectedAlbumId(albumId);
    setViewMode("album");
  };

  const handleBackToAlbumCatalog = () => {
    setSelectedAlbumId(null);
    setViewMode("albums");
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  const isSongView = viewMode === "catalog" || viewMode === "song";
  const isAlbumView = viewMode === "albums" || viewMode === "album";

  return (
    <div className="App">
      <header className="app-header">
        <h1>Resound Música</h1>
        <div className="header-info">
          {!artistEmail && (
            <>
              <div className="header-modes">
                <button
                  type="button"
                  className={`btn-mode ${isSongView ? "active" : ""}`}
                  onClick={() => {
                    setViewMode("catalog");
                    setSelectedSongId(null);
                    setSelectedAlbumId(null);
                  }}
                >
                  Explorar canciones
                </button>
                <button
                  type="button"
                  className={`btn-mode ${isAlbumView ? "active" : ""}`}
                  onClick={() => {
                    setViewMode("albums");
                    setSelectedAlbumId(null);
                    setSelectedSongId(null);
                  }}
                >
                  Explorar álbumes
                </button>
              </div>

              <div className="header-auth">
                {isListenerLoggedIn ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {/* --- NUEVO: ICONO DE PERFIL --- */}
                    <div 
                      title="Ir a mi perfil"
                      onClick={() => navigate(`/perfil/${currentUserEmail}`)}
                      style={{ cursor: 'pointer', fontSize: '1.5rem' }}
                    >
                      👤
                    </div>
                    {/* ----------------------------- */}
                    
                    <button type="button" className="btn-auth" onClick={handleLogout}>
                      Cerrar sesión
                    </button>
                  </div>
                ) : (
                  <button type="button" className="btn-auth" onClick={handleLoginClick}>
                    Iniciar sesión
                  </button>
                )}
              </div>
            </>
          )}

          {artistEmail && (
            <div className="header-artist" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {/* --- NUEVO: ICONO DE PERFIL --- */}
              <div 
                  title="Ir a mi perfil"
                  onClick={() => navigate(`/perfil/${currentUserEmail}`)}
                  style={{ cursor: 'pointer', fontSize: '1.5rem' }}
                >
                  👤
              </div>
              {/* ----------------------------- */}

              <span>Artista: {artistEmail}</span>
              <button type="button" onClick={handleLogout} className="btn-logout">
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      {/* VISTAS DE OYENTE */}
      {!artistEmail && viewMode === "catalog" && (
        <PublicCatalog onSelectSong={handleSelectSong} />
      )}

      {!artistEmail && viewMode === "song" && selectedSongId != null && (
        <PublicSongDetail
          songId={selectedSongId}
          onBack={handleBackToSongCatalog}
        />
      )}

      {!artistEmail && viewMode === "albums" && (
        <PublicAlbumCatalog onSelectAlbum={handleSelectAlbum} />
      )}

      {!artistEmail && viewMode === "album" && selectedAlbumId != null && (
        <PublicAlbumDetail
          albumId={selectedAlbumId}
          onBack={handleBackToAlbumCatalog}
        />
      )}

      {/* PANEL DE ARTISTA */}
      {artistEmail && viewMode === "artist" && (
        <>
          <div className="tabs">
            <button
              type="button"
              className={`tab ${activeTab === "albums" ? "active" : ""}`}
              onClick={() => setActiveTab("albums")}
            >
              Mis Álbumes ({albums.length})
            </button>
            <button
              type="button"
              className={`tab ${activeTab === "songs" ? "active" : ""}`}
              onClick={() => setActiveTab("songs")}
            >
              Mis Canciones ({songs.length})
            </button>
          </div>

          <div className="main-content">
            {activeTab === "albums" ? (
              <AlbumList albums={albums} onUpdate={handleUpdate} />
            ) : (
              <SongList
                songs={songs}
                onUpdate={handleUpdate}
                showAlbumColumn={true}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default MusicPage;