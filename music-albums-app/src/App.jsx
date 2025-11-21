import React, { useState, useEffect } from "react";
import {
  fetchArtistAlbums,
  fetchArtistSongs,
  getArtistEmailFromToken,
} from "./services/api";
import AlbumList from "./components/AlbumList";
import SongList from "./components/SongList";

import PublicCatalog from "./components/PublicCatalog";
import PublicSongDetail from "./components/PublicSongDetail";
import PublicAlbumCatalog from "./components/PublicAlbumCatalog";
import PublicAlbumDetail from "./components/PublicAlbumDetail";
import PlaylistsPage from "./components/PlaylistsPage";
import PlaylistDetailPage from "./components/PlaylistDetailPage";

import "./styles/App.css";

function App() {
  const [albums, setAlbums] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [artistEmail, setArtistEmail] = useState(null);
  const [activeTab, setActiveTab] = useState("albums"); // 'albums' o 'songs'
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);

  // modos de vista:
  // - 'catalog' / 'song'  -> catálogo público de canciones y detalle de canción
  // - 'albums' / 'album'  -> catálogo público de álbumes y detalle de álbum
  // - 'playlists' / 'playlist'-> listas de reproducción del oyente
  // - 'artist'            -> panel de artista
  const [viewMode, setViewMode] = useState("catalog");
  const [selectedSongId, setSelectedSongId] = useState(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [isListenerLoggedIn, setIsListenerLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const storedUserType = localStorage.getItem("userType");

    // Si hay token y es un artista, mostramos directamente el panel de artista
    if (token && storedUserType === "artist") {
      const email = getArtistEmailFromToken();
      if (email) {
        setArtistEmail(email);
        setViewMode("artist");
        loadData(email);
        return;
      }
    }

    // Para oyentes (user) o usuarios anónimos, la vista por defecto es el catálogo público
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
    // Limpiar cualquier información de autenticación que pueda existir
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
    // Redirige a la página clásica de login del microservicio de usuarios
    window.location.href = "/login.html";
  };

  // Eventos de oyente
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

  return (
    <div className="App">
      <header className="app-header">
        {/* si quieres el título viejo de develop, cambia este texto */}
        <h1>Resound</h1>
        <div className="header-info">
          {/* Vista de oyente: botones de exploración + login/logout */}
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
                    setSelectedPlaylistId(null);
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
                    setSelectedPlaylistId(null);
                  }}
                >
                  Explorar álbumes
                </button>

                {/* Solo tiene sentido "Mis playlists" si el oyente ha iniciado sesión */}
                {isListenerLoggedIn && (
                  <button
                    type="button"
                    className={`btn-mode ${isPlaylistsView ? "active" : ""}`}
                    onClick={() => {
                      setViewMode("playlists");
                      setSelectedSongId(null);
                      setSelectedAlbumId(null);
                      setSelectedPlaylistId(null);
                    }}
                  >
                    Mis playlists
                  </button>
                )}
              </div>

              <div className="header-auth">
                {isListenerLoggedIn ? (
                  <button
                    type="button"
                    className="btn-auth"
                    onClick={handleLogout}
                  >
                    Cerrar sesión
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-auth"
                    onClick={handleLoginClick}
                  >
                    Iniciar sesión
                  </button>
                )}
              </div>
            </>
          )}

          {artistEmail && (
            <div className="header-artist">
              <span>Artista: {artistEmail}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-logout"
              >
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
          onOpenSong={handleOpenSongFromAlbum}
        />
      )}

      {!artistEmail && viewMode === "playlists" && (
        <PlaylistsPage
          onOpenPlaylist={(id) => {
            setSelectedPlaylistId(id);
            setViewMode("playlist");
          }}
        />
      )}

      {!artistEmail &&
        viewMode === "playlist" &&
        selectedPlaylistId != null && (
          <PlaylistDetailPage
            playlistId={selectedPlaylistId}
            onBack={() => {
              setViewMode("playlists");
              setSelectedPlaylistId(null);
            }}
            onOpenSong={handleSelectSong}
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

export default App;
