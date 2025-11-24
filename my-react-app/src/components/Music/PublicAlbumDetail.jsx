// src/components/Music/PublicAlbumDetail.jsx
import React, { useEffect, useState } from "react";
import {
  fetchAlbumById,
  fetchAlbumTracks,
  fetchArtistsByEmails,
  registerSongPlay,
  purchaseAlbum,
  getStoredUserEmail,
  getPurchasedAlbums,
} from "../../services/musicApi";
import CommentsSection from "./CommentsSection"; // <--- 1. IMPORTANTE: Importar el componente

import { fileURL, formatDate } from "../../utils/helpers";
import "../../styles/MusicGlobal.css";

const PublicAlbumDetail = ({ albumId, onBack, onOpenSong }) => {
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [plays, setPlays] = useState(0);

  // Compra
  const [showPurchase, setShowPurchase] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [purchaseError, setPurchaseError] = useState("");
  const [purchaseOk, setPurchaseOk] = useState("");
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Verificación
  const [isAlbumPurchased, setIsAlbumPurchased] = useState(false);

  useEffect(() => {
    if (albumId == null) return;

    const loadAlbum = async () => {
      try {
        setLoading(true);
        setError("");
        setIsAlbumPurchased(false);

        const [albumData, tracksData] = await Promise.all([
          fetchAlbumById(albumId),
          fetchAlbumTracks(albumId),
        ]);

        // Verificación de compra de álbum
        const userEmail = getStoredUserEmail();
        const token = localStorage.getItem("authToken");
        if (token && userEmail) {
          const purchasedIds = await getPurchasedAlbums(userEmail);
          if (purchasedIds.includes(Number(albumId))) {
            setIsAlbumPurchased(true);
          }
        }

        let albumWithArtists = albumData;
        try {
          const emails = Array.isArray(albumData.artistas_emails)
            ? albumData.artistas_emails
            : [];
          if (emails.length > 0) {
            const artistsByEmail = await fetchArtistsByEmails(emails);
            const artistas = emails.map((email) => {
              const artist = artistsByEmail[email];
              if (artist)
                return (
                  artist.display_name ||
                  artist.nombre_artistico ||
                  artist.email ||
                  email
                );
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
          console.warn(innerErr);
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

  const canciones = tracks;
  const currentTrack =
    canciones.length > 0
      ? canciones[Math.min(currentTrackIndex, canciones.length - 1)]
      : null;

  useEffect(() => {
    if (!currentTrack) return;
    setPlays(currentTrack.numVisualizaciones || 0);
  }, [currentTrack]);

  const handlePlayClick = async (song) => {
    if (!song || !song.id) return;
    setPlays((p) => p + 1);
    try {
      const updated = await registerSongPlay(song.id);
      if (updated && typeof updated.numVisualizaciones === "number") {
        setPlays(updated.numVisualizaciones);
        setTracks((prev) =>
          prev.map((t) =>
            t.id === song.id
              ? { ...t, numVisualizaciones: updated.numVisualizaciones }
              : t,
          ),
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openPurchaseModal = () => {
    setPurchaseError("");
    setPurchaseOk("");
    const token = localStorage.getItem("authToken");
    if (!token) setPurchaseError("Necesitas iniciar sesión para comprar.");
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
    const amount =
      payAmount === "" || payAmount === null
        ? null
        : Number.parseFloat(payAmount);
    if (payAmount !== "" && (Number.isNaN(amount) || amount < 0)) {
      setPurchaseError("Introduce un importe válido.");
      return;
    }

    setPurchaseLoading(true);
    setPurchaseError("");

    try {
      await purchaseAlbum({
        albumId: album.id,
        pricePaid: amount,
        userEmail: email,
      });
      setPurchaseOk("Álbum comprado correctamente.");
      setIsAlbumPurchased(true);
    } catch (err) {
      const msg =
        err?.response?.data?.detail || err?.message || "Error compra.";
      setPurchaseError(msg);
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (loading) return <div className="loading">Cargando álbum…</div>;
  if (error) return <div className="no-content">{error}</div>;
  if (!album) return <div className="no-content">Álbum no encontrado.</div>;

  const cover =
    fileURL(album.imgPortada || album.portada) || "/placeholder-album.png";
  const artistNames = album.artistas_display || "Varios artistas";
  const price = Number(album.precio ?? 0);

  return (
    <section className="album-page">
      <button type="button" className="btn-back" onClick={onBack}>
        ← Volver al catálogo
      </button>

      <div className="album-layout">
        <div className="album-main">
          <div className="album-player-card">
            <h2 className="album-title">{album.titulo}</h2>
            <p className="album-artist">{artistNames}</p>

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
              {isAlbumPurchased ? (
                <button
                  type="button"
                  className="btn-success"
                  disabled
                  style={{
                    cursor: "default",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    width: "100%",
                  }}
                >
                  ✅ Álbum Comprado
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={openPurchaseModal}
                >
                  Comprar álbum digital completo{" "}
                  {price > 0 ? `${price.toFixed(2)} € o más` : "(elige precio)"}
                </button>
              )}

              <p className="purchase-note">
                {isAlbumPurchased
                  ? "Ya posees este álbum y todas sus canciones."
                  : "Incluye todas las canciones del álbum en tu biblioteca digital."}
              </p>
            </div>
          </div>

          <div className="album-tracklist">
            <h3>Lista de canciones</h3>
            {canciones.length === 0 ? (
              <p>Vacío</p>
            ) : (
              <ol>
                {canciones.map((song, index) => (
                  <li
                    key={song.id}
                    className={`track-item ${index === currentTrackIndex ? "active" : ""}`}
                    onClick={() => {
                      setCurrentTrackIndex(index);
                      if (onOpenSong) onOpenSong(song.id);
                    }}
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
                    <span className="track-title">{song.nomCancion}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="album-cover-side">
          <img src={cover} alt={album.titulo} />
        </div>
      </div>

      {/* 2. IMPORTANTE: Añadir la sección de comentarios aquí */}
      {album && (
        <div style={{ marginTop: "40px" }}>
          <CommentsSection targetType="album" targetId={album.id} />
        </div>
      )}

      {showPurchase && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Comprar álbum completo</h3>
            <input
              type="number"
              min={price}
              step="0.01"
              className="modal-input"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
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
              {!purchaseOk && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleConfirmPurchase}
                  disabled={purchaseLoading}
                >
                  {purchaseLoading ? "Procesando…" : "Pagar y comprar"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PublicAlbumDetail;
