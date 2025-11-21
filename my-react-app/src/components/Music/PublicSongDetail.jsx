import React, { useEffect, useState } from "react";
import {
  fetchSongById,
  fetchAlbumById,
  fetchArtistsByEmails,
  registerSongPlay,
  purchaseSong,
  getStoredUserEmail
} from "../../services/musicApi";

import { fileURL } from "../../utils/helpers";

const formatPrice = (value) => {
  if (value === null || value === undefined) return "No disponible";
  const num = Number(value);
  if (Number.isNaN(num)) return "No disponible";
  if (num === 0) return "Gratis";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(num);
};

const getArtistLabel = (song) => {
  if (Array.isArray(song.artistas) && song.artistas.length > 0) {
    const first = song.artistas[0];
    if (typeof first === "string") {
      return song.artistas.join(", ");
    }
    if (first.nickname) {
      return song.artistas.map((a) => a.nickname).join(", ");
    }
    if (first.email) {
      return song.artistas.map((a) => a.email).join(", ");
    }
  }

  if (Array.isArray(song.artistas_emails) && song.artistas_emails.length > 0) {
    return song.artistas_emails.join(", ");
  }

  if (song.artistNickname) return song.artistNickname;
  if (song.artistEmail) return song.artistEmail;

  return "Artista desconocido";
};

const PublicSongDetail = ({ songId, onBack }) => {
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [plays, setPlays] = useState(0);
  const [album, setAlbum] = useState(null);
  const [artistName, setArtistName] = useState("");
  const [showPurchase, setShowPurchase] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [purchaseOk, setPurchaseOk] = useState("");

  useEffect(() => {
    const loadSong = async () => {
      try {
        setLoading(true);
        setErr("");

        const data = await fetchSongById(songId);
        setSong(data);
        setPlays(data.numVisualizaciones || 0);
        setPayAmount(data.precio ?? "");

        // --- Álbum al que pertenece, si lo hay ---
        if (data.idAlbum != null) {
          try {
            const albumData = await fetchAlbumById(data.idAlbum);
            setAlbum(albumData);
          } catch (error) {
            console.warn("No se pudo cargar el álbum de la canción:", error);
          }
        }

        // --- Nombre del artista (display_name) ---
        if (
          Array.isArray(data.artistas_emails) &&
          data.artistas_emails.length
        ) {
          try {
            const emails = data.artistas_emails;
            const artistsByEmail = await fetchArtistsByEmails(emails);

            const firstEmail = emails[0];
            const artist = artistsByEmail[firstEmail];

            if (artist) {
              setArtistName(
                artist.display_name ||
                  artist.nombre_artistico ||
                  artist.email ||
                  firstEmail,
              );
            } else {
              // fallback bonito
              setArtistName(
                typeof firstEmail === "string"
                  ? firstEmail.split("@")[0]
                  : "Artista",
              );
            }
          } catch (error) {
            console.warn(
              "No se pudo resolver el display_name del artista:",
              error,
            );
          }
        }
      } catch (error) {
        console.error("Error cargando canción:", error);
        setErr("No se ha podido cargar la canción.");
      } finally {
        setLoading(false);
      }
    };

    if (songId) {
      loadSong();
    }
  }, [songId]);

  // Llamada a la API para registrar reproducción
  const handlePlayClick = async () => {
    if (!song || !song.id) return;

    // Incremento optimista en UI
    setPlays((p) => p + 1);

    try {
      const updated = await registerSongPlay(song.id);
      if (updated && typeof updated.numVisualizaciones === "number") {
        setSong(updated);
        setPlays(updated.numVisualizaciones);
      }
    } catch (error) {
      console.error("Error registrando reproducción:", error);
      // Podrías revertir el +1 si quisieras ser estricto
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
    if (!song) return;

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
      setPurchaseError("Introduce un importe válido (0€ o más).");
      return;
    }

    setPurchaseLoading(true);
    setPurchaseError("");
    setPurchaseOk("");

    try {
      await purchaseSong({
        songId: song.id,
        pricePaid: amount,
        userEmail: email,
      });
      setPurchaseOk("Compra realizada correctamente. ¡Disfruta tu pista!");
    } catch (error) {
      const msg =
        error?.response?.data?.detail ||
        error?.message ||
        "No se pudo completar la compra.";
      setPurchaseError(msg);
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (!songId) {
    return (
      <div className="public-song-detail">
        <p>No se ha seleccionado ninguna canción.</p>
        {onBack && (
          <button type="button" className="btn-link" onClick={onBack}>
            Volver al catálogo
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Cargando canción…</div>;
  }

  if (err || !song) {
    return (
      <div className="public-song-detail">
        <p className="error">{err || "Canción no encontrada."}</p>
        {onBack && (
          <button type="button" className="btn-link" onClick={onBack}>
            Volver al catálogo
          </button>
        )}
      </div>
    );
  }

  const coverPath =
    song.imgPortada ||
    song.imgSencillo ||
    song.portada ||
    song.coverPath ||
    null;

  const coverSrc = coverPath
    ? fileURL(coverPath)
    : "https://via.placeholder.com/500x500?text=Sin+portada";

  // Álbum correcto: primero el cargado, luego el que traiga la canción
  const albumTitle = album?.titulo || song.albumTitulo || "Sencillo";

  // Preferimos display_name si lo tenemos
  const artistLabel = artistName || getArtistLabel(song);

  let publishedLabel = null;
  if (song.date) {
    const d = new Date(song.date);
    const formatted = Number.isNaN(d.getTime())
      ? String(song.date)
      : d.toLocaleDateString("es-ES");
    publishedLabel = `Publicado el ${formatted}`;
  }

  return (
    <div className="public-song-detail">
      {onBack && (
        <button type="button" className="btn-link back-button" onClick={onBack}>
          ← Volver al catálogo
        </button>
      )}

      <div className="public-song-layout">
        <div className="public-song-cover">
          <img
            src={coverSrc}
            alt={song.nomCancion || song.titulo || "Portada de canción"}
          />
        </div>

        <div className="public-song-info">
          <h2 className="song-title">
            {song.nomCancion || song.titulo || "Canción sin título"}
          </h2>
          <div className="song-artist">por {artistLabel}</div>
          <div className="song-album">del álbum {albumTitle}</div>

          {publishedLabel && <div className="song-date">{publishedLabel}</div>}

          <div className="song-stats">
            <button
              type="button"
              className="btn-play"
              onClick={handlePlayClick}
            >
              ▶ Reproducir
            </button>
            <span className="plays-label">Reproducciones: {plays}</span>
          </div>

          <div className="song-purchase">
            <button type="button" className="btn-primary" onClick={openPurchaseModal}>
              Comprar pista digital {formatPrice(song.precio)}
            </button>
            <p className="purchase-note">
              Recibirás la pista y las futuras descargas ligadas a tu cuenta.
            </p>
          </div>
        </div>
      </div>

      {showPurchase && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Confirmar compra</h3>
            <p className="modal-subtitle">
              {song.nomCancion || "Canción"} · {artistLabel}
            </p>

            <label className="modal-label" htmlFor="song-price">
              Importe a pagar (€)
            </label>
            <input
              id="song-price"
              type="number"
              min="0"
              step="0.01"
              className="modal-input"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="Usar precio por defecto"
            />
            <p className="modal-hint">
              Puedes dejarlo en blanco para usar el precio actual
              ({formatPrice(song.precio)}).
            </p>

            {purchaseError && <div className="modal-error">{purchaseError}</div>}
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
    </div>
  );
};

export default PublicSongDetail;
