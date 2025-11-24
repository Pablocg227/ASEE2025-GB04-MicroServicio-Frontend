import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import {
  fetchArtistAlbums,
  fetchArtistSongs,
  getArtistEmailFromToken,
} from "../../services/musicApi";

import AlbumList from "./AlbumList";
import SongList from "./SongList";
import PublicCatalog from "./PublicCatalog";
import PublicSongDetail from "./PublicSongDetail";
import PublicAlbumCatalog from "./PublicAlbumCatalog";
import PublicAlbumDetail from "./PublicAlbumDetail";
import PlaylistsPage from "./PlaylistsPage";
import PlaylistDetailPage from "./PlaylistDetailPage";

import "../../styles/MusicGlobal.css";

function MusicPage() {
  const [albums, setAlbums] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Datos de sesión
  const [artistEmail, setArtistEmail] = useState(null);
  const [isListenerLoggedIn, setIsListenerLoggedIn] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  // Navegación interna
  const [activeTab, setActiveTab] = useState("albums"); 
  
  // Modos de vista
  const [viewMode, setViewMode] = useState("catalog");
  
  const [selectedSongId, setSelectedSongId] = useState(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const storedUserType = localStorage.getItem("userType");

    if (token) {
      const emailFromToken = getArtistEmailFromToken();
      if (emailFromToken) {
        setCurrentUserEmail(emailFromToken);
      }
    }

    if (token && storedUserType === "artist") {
      const email = getArtistEmailFromToken();
      if (email) {
        setArtistEmail(email);
        loadData(email); 
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
      const [albumsData, songsData] = await Promise.all([
        fetchArtistAlbums(email),
        fetchArtistSongs(email),
      ]);
      setAlbums(albumsData);
      setSongs(songsData);
    } catch (error) {
      console.error("Error loading data:", error);
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
    setCurrentUserEmail(null);
  };

  const handleLoginClick = () => {
    window.location.href = "/login.html";
  };

  // --- Handlers de navegación pública ---
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

  const handleOpenSongFromAlbum = (songId) => {
    setSelectedSongId(songId);
    setViewMode("song");
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  const isSongView = viewMode === "catalog" || viewMode === "song";
  const isAlbumView = viewMode === "albums" || viewMode === "album";
  const isPlaylistsView = viewMode === "playlists" || viewMode === "playlist";
  const isArtistPanelView = viewMode === "artist_panel";

  return (
    <div className="App">
      <header className="app-header">
        <h1>Resound Música</h1>
        
        <div className="header-info">
          
          {/* BARRA DE NAVEGACIÓN IZQUIERDA */}
          <div className="header-modes">
             <button
              type="button"
              className={`btn-mode ${isSongView ? "active" : ""}`}
              onClick={() => {
                setViewMode("catalog");
                setSelectedSongId(null);
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
              }}
            >
              Explorar álbumes
            </button>

            {(isListenerLoggedIn || artistEmail) && (
              <button
                type="button"
                className={`btn-mode ${isPlaylistsView ? "active" : ""}`}
                onClick={() => {
                  setViewMode("playlists");
                  setSelectedPlaylistId(null);
                }}
              >
                Mis playlists
              </button>
            )}
            
             {artistEmail && (
              <>
                <button
                  type="button"
                  className={`btn-mode ${isArtistPanelView ? "active" : ""}`}
                  style={{ marginLeft: '10px', backgroundColor: isArtistPanelView ? '#fff' : 'rgba(0,0,0,0.2)', borderColor: '#fff' }}
                  onClick={() => setViewMode("artist_panel")}
                >
                  ✏️ Gestionar Música
                </button>
                <button
                  type="button"
                  className="btn-mode"
                  style={{ marginLeft: '10px', backgroundColor: 'rgba(0,0,0,0.2)', borderColor: '#fff' }}
                  onClick={() => window.location.href = "/FormularioSubidaCancion.html"}
                >
                  🎵 Subir Canción
                </button>
                <button
                  type="button"
                  className="btn-mode"
                  style={{ marginLeft: '5px', backgroundColor: 'rgba(0,0,0,0.2)', borderColor: '#fff' }}
                  onClick={() => window.location.href = "/FormularioAlbum.html"}
                >
                  💿 Subir Álbum
                </button>
              </>
            )}
          </div>

          {/* ZONA DERECHA: AYUDA, PERFIL Y LOGOUT */}
          <div className="header-auth" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* BOTÓN DE AYUDA ------------------ */}
            <button 
              type="button" 
              className="btn-mode"
              style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.5)' }}
              onClick={() => window.location.href = "/faq.html"}
              title="Preguntas Frecuentes"
            >
              ❓ Ayuda
            </button>
            {/* --------------------------- */}

            {currentUserEmail ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div 
                  title="Ir a mi perfil"
                  onClick={() => navigate(`/perfil/${currentUserEmail}`)}
                  style={{ cursor: 'pointer', fontSize: '1.5rem' }}
                >
                  👤
                </div>
                {artistEmail && <span style={{fontSize: '0.8rem', opacity: 0.8}}>Artista</span>}
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
        </div>
      </header>

      {/* ------------------------------------------------------ */}
      {/* RENDERIZADO DE VISTAS                     */}
      {/* ------------------------------------------------------ */}

      {viewMode === "catalog" && (
        <PublicCatalog onSelectSong={handleSelectSong} />
      )}

      {viewMode === "song" && selectedSongId != null && (
        <PublicSongDetail
          songId={selectedSongId}
          onBack={handleBackToSongCatalog}
        />
      )}

      {viewMode === "albums" && (
        <PublicAlbumCatalog onSelectAlbum={handleSelectAlbum} />
      )}

      {viewMode === "album" && selectedAlbumId != null && (
        <PublicAlbumDetail
          albumId={selectedAlbumId}
          onBack={handleBackToAlbumCatalog}
          onOpenSong={handleOpenSongFromAlbum}
        />
      )}

      {viewMode === "playlists" && (
        <PlaylistsPage
          onOpenPlaylist={(id) => {
            setSelectedPlaylistId(id);
            setViewMode("playlist");
          }}
        />
      )}

      {viewMode === "playlist" && selectedPlaylistId != null && (
        <PlaylistDetailPage
          playlistId={selectedPlaylistId}
          onBack={() => {
            setViewMode("playlists");
            setSelectedPlaylistId(null);
          }}
          onOpenSong={handleSelectSong}
        />
      )}

      {artistEmail && viewMode === "artist_panel" && (
        <>
          <div className="tabs" style={{ marginTop: '20px' }}>
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