// src/components/PublicAlbumDetail.jsx
import React, { useEffect, useState } from "react";
import {
  fetchAlbumById,
  fetchAlbumTracks,
  fetchArtistsByEmails,
  registerSongPlay,
  purchaseAlbum,
  getStoredUserEmail,
} from "../../services/musicApi";

import { fileURL, formatDate } from "../../utils/helpers";
import "../../styles/MusicGlobal.css";

const PublicAlbumDetail = ({ albumId, onBack }) => {
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [plays, setPlays] = useState(0);
  const [showPurchase, setShowPurchase] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [purchaseError, setPurchaseError] = useState("");
  const [purchaseOk, setPurchaseOk] = useState("");
  const [purchaseLoading, setPurchaseLoading] = useState(false);

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
        setPayAmount(albumData?.precio ?? "");
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

  const openPurchaseModal = () => {
    setPurchaseError("");
    setPurchaseOk("");

    const token = localStorage.getItem("authToken");
    if (!token) {
      setPurchaseError("Necesitas iniciar sesión para comprar.");
    }

    setShowPurchase(true);
  };

  const closePurchaseModal = () => {
    if (purchaseLoading) return;
    setShowPurchase(false);
    setPurchaseError("");
    setPurchaseOk("");
  };

  const handleConfirmPurchase = async () => {
    if (!album) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      setPurchaseError("Inicia sesión para completar la compra.");
      return;
    }

    const email = getStoredUserEmail();
    if (!email) {
      setPurchaseError("No se pudo leer el email del usuario.");
      return;
    }

    const amount =
      payAmount === "" || payAmount === null
        ? null
        : Number.parseFloat(payAmount);

    if (payAmount !== "" && (Number.isNaN(amount) || amount < 0)) {
      setPurchaseError(
        "Introduce un importe válido (mínimo el precio del álbum).",
      );
      return;
    }

    // El backend validará que price_paid >= precio actual del álbum
    setPurchaseLoading(true);
    setPurchaseError("");
    setPurchaseOk("");

    try {
      await purchaseAlbum({
        albumId: album.id,
        pricePaid: amount,
        userEmail: email,
      });
      setPurchaseOk(
        "Álbum comprado correctamente. Todas las pistas quedan asociadas a tu cuenta.",
      );
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "No se pudo completar la compra del álbum.";
      setPurchaseError(msg);
    } finally {
      setPurchaseLoading(false);
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
              <button
                type="button"
                className="btn-primary"
                onClick={openPurchaseModal}
              >
                Comprar álbum digital completo{" "}
                {price > 0
                  ? `${price.toFixed(2)} € o más`
                  : "(elige tu precio)"}
              </button>
              <p className="purchase-note">
                Incluye todas las canciones del álbum en tu biblioteca digital.
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

      {showPurchase && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Comprar álbum completo</h3>
            <p className="modal-subtitle">
              {album.titulo} · {artistNames}
            </p>

            <label className="modal-label" htmlFor="album-price">
              Importe a pagar (€)
            </label>
            <input
              id="album-price"
              type="number"
              min={Math.max(0, Number(album.precio ?? 0))}
              step="0.01"
              className="modal-input"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="Usa el precio base del álbum"
            />
            <p className="modal-hint">
              Precio mínimo:{" "}
              {price > 0 ? `${price.toFixed(2)} €` : "puedes elegir 0€ o más"}.
              Si dejas el campo en blanco se usará el precio actual del álbum.
            </p>

            {purchaseError && (
              <div className="modal-error">{purchaseError}</div>
            )}
            {purchaseOk && <div className="modal-success">{purchaseOk}</div>}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={closePurchaseModal}
                disabled={purchaseLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmPurchase}
                disabled={purchaseLoading}
              >
                {purchaseLoading ? "Procesando…" : "Pagar y comprar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PublicAlbumDetail;
