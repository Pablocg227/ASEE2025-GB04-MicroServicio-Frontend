import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchArtistAlbums,
  fetchArtistSongs,
  getArtistEmailFromToken,
} from "../../services/musicApi";

import AlbumList from "./AlbumList";
import SongList from "./SongList";
import PublicCatalog from "./PublicCatalog";
import PublicAlbumCatalog from "./PublicAlbumCatalog";
import PlaylistsPage from "./PlaylistsPage";
import ArtistStatsPanel from "./ArtistStatsPanel";

import "../../styles/MusicGlobal.css";

// Aceptamos onPlay por si algún componente interno lo necesita en el futuro
function MusicPage({ onPlay }) {
  const [albums, setAlbums] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [artistEmail, setArtistEmail] = useState(null);
  const [isListenerLoggedIn, setIsListenerLoggedIn] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  const [activeTab, setActiveTab] = useState("albums");
  const [viewMode, setViewMode] = useState("catalog");

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
    setCurrentUserEmail(null);
  };

  const handleLoginClick = () => {
    window.location.href = "/login.html";
  };

  // Navegación a las rutas de detalle
  const handleSelectSong = (songId) => {
    navigate(`/musica/cancion/${songId}`);
  };

  const handleSelectAlbum = (albumId) => {
    navigate(`/musica/album/${albumId}`);
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  const isSongView = viewMode === "catalog";
  const isAlbumView = viewMode === "albums";
  const isPlaylistsView = viewMode === "playlists";
  const isArtistPanelView = viewMode === "artist_panel";
  const isStatsView = viewMode === "stats";

  return (
    <div className="music-page-wrapper">
      <header className="app-header">
        <h1>Resound Música</h1>

        <div className="header-info">
          <div className="header-modes">
            <button
              type="button"
              className={`btn-mode ${isSongView ? "active" : ""}`}
              onClick={() => setViewMode("catalog")}
            >
              Explorar canciones
            </button>
            <button
              type="button"
              className={`btn-mode ${isAlbumView ? "active" : ""}`}
              onClick={() => setViewMode("albums")}
            >
              Explorar álbumes
            </button>

            {(isListenerLoggedIn || artistEmail) && (
              <button
                type="button"
                className={`btn-mode ${isPlaylistsView ? "active" : ""}`}
                onClick={() => setViewMode("playlists")}
              >
                Mis playlists
              </button>
            )}

            {artistEmail && (
              <>
                <button
                  type="button"
                  className={`btn-mode ${isArtistPanelView ? "active" : ""}`}
                  style={{
                    marginLeft: "10px",
                    backgroundColor: isArtistPanelView
                      ? "#fff"
                      : "rgba(0,0,0,0.2)",
                    borderColor: "#fff",
                  }}
                  onClick={() => setViewMode("artist_panel")}
                >
                  ✏️ Gestionar Música
                </button>
                <button
                  type="button"
                  className={`btn-mode ${isStatsView ? "active" : ""}`}
                  style={{
                    marginLeft: "10px",
                    backgroundColor: isStatsView ? "#fff" : "rgba(0,0,0,0.2)",
                    borderColor: "#fff",
                  }}
                  onClick={() => setViewMode("stats")}
                >
                  📈 Panel de estadísticas
                </button>
                <button
                  type="button"
                  className="btn-mode"
                  style={{
                    marginLeft: "10px",
                    backgroundColor: "rgba(0,0,0,0.2)",
                    borderColor: "#fff",
                  }}
                  onClick={() =>
                    (window.location.href = "/FormularioSubidaCancion.html")
                  }
                >
                  🎵 Subir Canción
                </button>
                <button
                  type="button"
                  className="btn-mode"
                  style={{
                    marginLeft: "5px",
                    backgroundColor: "rgba(0,0,0,0.2)",
                    borderColor: "#fff",
                  }}
                  onClick={() =>
                    (window.location.href = "/FormularioAlbum.html")
                  }
                >
                  💿 Subir Álbum
                </button>
              </>
            )}
          </div>

          <div
            className="header-auth"
            style={{ display: "flex", alignItems: "center", gap: "15px" }}
          >
            <button
              type="button"
              className="btn-mode"
              style={{
                backgroundColor: "transparent",
                border: "1px solid rgba(255,255,255,0.5)",
              }}
              onClick={() => (window.location.href = "/faq.html")}
              title="Preguntas Frecuentes"
            >
              ❓ Ayuda
            </button>

            {currentUserEmail ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "15px" }}
              >
                <div
                  title="Ir a mi perfil"
                  onClick={() => navigate(`/perfil/${currentUserEmail}`)}
                  style={{ cursor: "pointer", fontSize: "1.5rem" }}
                >
                  👤
                </div>
                {artistEmail && (
                  <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                    Artista
                  </span>
                )}
                <button
                  type="button"
                  className="btn-auth"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
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
        </div>
      </header>

      {/* RENDERIZADO DE VISTAS */}

      {viewMode === "catalog" && (
        <PublicCatalog onSelectSong={handleSelectSong} />
      )}

      {viewMode === "albums" && (
        <PublicAlbumCatalog onSelectAlbum={handleSelectAlbum} />
      )}

      {viewMode === "playlists" && (
        <PlaylistsPage
          onOpenPlaylist={(id) => navigate(`/musica/playlist/${id}`)}
        />
      )}

      {/* PANELES DE ARTISTA */}
      {artistEmail && viewMode === "artist_panel" && (
        <>
          <div className="tabs" style={{ marginTop: "20px" }}>
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

      {artistEmail && viewMode === "stats" && (
        <ArtistStatsPanel artistEmail={artistEmail} />
      )}
    </div>
  );
}

export default MusicPage;
