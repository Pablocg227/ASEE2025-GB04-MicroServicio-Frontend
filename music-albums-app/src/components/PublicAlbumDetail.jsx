// src/components/PublicAlbumDetail.jsx
import React, { useEffect, useState } from "react";
import {
  fetchAlbumById,
  fetchAlbumTracks,
  fetchArtistsByEmails,
  registerSongPlay,
} from "../services/api";

import { fileURL, formatDate } from "../utils/helpers";
import "../styles/App.css";

const PublicAlbumDetail = ({ albumId, onBack }) => {
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [plays, setPlays] = useState(0); // 👈 bien nombrado

  // 1) Cargar álbum + canciones + nombres de artista
  useEffect(() => {
    if (albumId == null) return;

    const loadAlbum = async () => {
      try {
        setLoading(true);
        setError("");

        const [albumData, tracksData] = await Promise.all([
          fetchAlbumById(albumId),
          fetchAlbumTracks(albumId),
        ]);

        let albumWithArtists = albumData;

        try {
          const emails = Array.isArray(albumData.artistas_emails)
            ? albumData.artistas_emails
            : [];

          if (emails.length > 0) {
            const artistsByEmail = await fetchArtistsByEmails(emails);

            const artistas = emails.map((email) => {
              const artist = artistsByEmail[email];
              if (artist) {
                return (
                  artist.display_name ||
                  artist.nombre_artistico ||
                  artist.email ||
                  email
                );
              }

              // Fallback bonito si no se encuentra en msUsuarios
              return typeof email === "string"
                ? email.split("@")[0]
                : "Artista";
            });

            albumWithArtists = {
              ...albumData,
              artistas,
              artistas_display: artistas.join(", "),
            };
          }
        } catch (innerErr) {
          console.warn(
            "No se pudieron resolver los nombres de artistas del álbum:",
            innerErr,
          );
        }

        setAlbum(albumWithArtists);
        setTracks(tracksData || []);
      } catch (err) {
        console.error("Error cargando álbum:", err);
        setError("No se han podido cargar los datos del álbum.");
      } finally {
        setLoading(false);
      }
    };

    loadAlbum();
  }, [albumId]);

  // 2) Track actual y sincronizar reproducciones con numVisualizaciones
  const canciones = tracks;

  const currentTrack =
    canciones.length > 0
      ? canciones[Math.min(currentTrackIndex, canciones.length - 1)]
      : null;

  useEffect(() => {
    if (!currentTrack) return;
    setPlays(currentTrack.numVisualizaciones || 0);
  }, [currentTrack]);

  // 3) Registrar reproducción
  const handlePlayClick = async (song) => {
    if (!song || !song.id) return;

    // subimos en UI
    setPlays((p) => p + 1);

    try {
      const updated = await registerSongPlay(song.id);
      if (updated && typeof updated.numVisualizaciones === "number") {
        setPlays(updated.numVisualizaciones);

        // Actualizar también la lista de canciones
        setTracks((prev) =>
          prev.map((t) =>
            t.id === song.id
              ? { ...t, numVisualizaciones: updated.numVisualizaciones }
              : t,
          ),
        );
      }
    } catch (err) {
      console.error("Error registrando reproducción:", err);
    }
  };

  // 4) GUARDAS (después de TODOS los hooks, para no romper la regla de hooks)
  if (albumId == null) return null;
  if (loading) return <div className="loading">Cargando álbum…</div>;
  if (error) return <div className="no-content">{error}</div>;
  if (!album) return <div className="no-content">Álbum no encontrado.</div>;

  const cover =
    fileURL(album.imgPortada || album.portada || album.coverPath) ||
    "/placeholder-album.png";

  const rawGenres = album.genre || album.genres || [];
  const genresText = Array.isArray(rawGenres)
    ? rawGenres.join(", ")
    : String(rawGenres || "");

  const artistNames =
    album.artistas_display ||
    (Array.isArray(album.artistas)
      ? album.artistas.join(", ")
      : "Varios artistas");

  const price = Number(album.precio ?? 0);

  return (
    <section className="album-page">
      <button type="button" className="btn-back" onClick={onBack}>
        ← Volver al catálogo de álbumes
      </button>

      <div className="album-layout">
        {/* COLUMNA IZQUIERDA: info + “player” + tracklist */}
        <div className="album-main">
          <div className="album-player-card">
            <h2 className="album-title">{album.titulo}</h2>
            <p className="album-artist">{artistNames}</p>

            {album.date && (
              <p className="album-meta">Lanzado el {formatDate(album.date)}</p>
            )}
            {genresText && <p className="album-meta">Géneros: {genresText}</p>}

            {currentTrack && (
              <div className="album-player">
                <button
                  type="button"
                  className="btn-play big"
                  onClick={() => handlePlayClick(currentTrack)}
                >
                  ▶
                </button>
                <span>Reproducciones: {plays}</span>

                <div className="album-player-info">
                  <div className="player-track-title">
                    {currentTrack.nomCancion || currentTrack.titulo}
                  </div>
                </div>
              </div>
            )}

            <div className="album-purchase">
              <button type="button" className="btn-primary">
                Comprar álbum digital completo{" "}
                {price > 0
                  ? `${price.toFixed(2)} € o más`
                  : "(elige tu precio)"}
              </button>
              <p className="purchase-note">
                El flujo de compra se implementará en otro requisito. De momento
                este botón no realiza ninguna acción.
              </p>
            </div>
          </div>

          {/* Tracklist */}
          <div className="album-tracklist">
            <h3>Lista de canciones</h3>
            {canciones.length === 0 ? (
              <p className="no-content">
                Este álbum todavía no tiene canciones asociadas.
              </p>
            ) : (
              <ol>
                {canciones.map((song, index) => {
                  const isActive = index === currentTrackIndex;
                  return (
                    <li
                      key={song.id}
                      className={`track-item ${isActive ? "active" : ""}`}
                      onClick={() => setCurrentTrackIndex(index)}
                    >
                      <button
                        type="button"
                        className="track-play-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentTrackIndex(index);
                          handlePlayClick(song);
                        }}
                      >
                        ▶
                      </button>

                      <span className="track-number">{index + 1}.</span>
                      <span className="track-title">
                        {song.nomCancion || song.titulo}
                      </span>
                      {typeof song.precio === "number" && (
                        <span className="track-price">
                          {song.precio.toFixed(2)} €
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: portada grande */}
        <div className="album-cover-side">
          <img src={cover} alt={album.titulo} />
        </div>
      </div>
    </section>
  );
};

export default PublicAlbumDetail;
