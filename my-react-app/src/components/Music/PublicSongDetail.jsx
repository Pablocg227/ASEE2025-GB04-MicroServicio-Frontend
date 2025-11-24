import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf"; 
import {
  fetchSongById,
  fetchAlbumById,
  fetchArtistsByEmails,
  registerSongPlay,
  purchaseSong,
  getStoredUserEmail
} from "../../services/musicApi";
import AddToPlaylistModal from "./AddToPlaylistModal";
// 1. IMPORTAR SHARE MODAL
import ShareModal from "../ShareModal"; 

import { fileURL } from "../../utils/helpers";

// ... (funciones formatPrice y getArtistLabel se mantienen igual) ...
const formatPrice = (value) => { /* ... */ if (value === null || value === undefined) return "No disponible"; const num = Number(value); if (Number.isNaN(num)) return "No disponible"; if (num === 0) return "Gratis"; return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", }).format(num); };
const getArtistLabel = (song) => { /* ... */ if (Array.isArray(song.artistas) && song.artistas.length > 0) { const first = song.artistas[0]; if (typeof first === "string") { return song.artistas.join(", "); } if (first.nickname) { return song.artistas.map((a) => a.nickname).join(", "); } if (first.email) { return song.artistas.map((a) => a.email).join(", "); } } if (Array.isArray(song.artistas_emails) && song.artistas_emails.length > 0) { return song.artistas_emails.join(", "); } if (song.artistNickname) return song.artistNickname; if (song.artistEmail) return song.artistEmail; return "Artista desconocido"; };

const PublicSongDetail = ({ songId, onBack }) => {
  // ... (estados existentes) ...
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
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  
  // 2. NUEVO ESTADO PARA COMPARTIR
  const [showShareModal, setShowShareModal] = useState(false);

  // ... (useEffect y funciones existentes handlePlayClick, openPurchaseModal, etc. se mantienen igual) ...
  
  // ... (AQUÍ COPIAS TU CÓDIGO EXISTENTE DE HOOKS Y FUNCIONES DE PDF/COMPRA) ...
  useEffect(() => { const loadSong = async () => { try { setLoading(true); setErr(""); const data = await fetchSongById(songId); setSong(data); setPlays(data.numVisualizaciones || 0); setPayAmount(data.precio ?? ""); if (data.idAlbum != null) { try { const albumData = await fetchAlbumById(data.idAlbum); setAlbum(albumData); } catch (error) { console.warn("No se pudo cargar el álbum de la canción:", error); } } if ( Array.isArray(data.artistas_emails) && data.artistas_emails.length ) { try { const emails = data.artistas_emails; const artistsByEmail = await fetchArtistsByEmails(emails); const firstEmail = emails[0]; const artist = artistsByEmail[firstEmail]; if (artist) { setArtistName( artist.display_name || artist.nombre_artistico || artist.email || firstEmail, ); } else { setArtistName( typeof firstEmail === "string" ? firstEmail.split("@")[0] : "Artista", ); } } catch (error) { console.warn( "No se pudo resolver el display_name del artista:", error, ); } } } catch (error) { console.error("Error cargando canción:", error); setErr("No se ha podido cargar la canción."); } finally { setLoading(false); } }; if (songId) { loadSong(); } }, [songId]);
  const handlePlayClick = async () => { if (!song || !song.id) return; setPlays((p) => p + 1); try { const updated = await registerSongPlay(song.id); if (updated && typeof updated.numVisualizaciones === "number") { setSong(updated); setPlays(updated.numVisualizaciones); } } catch (error) { console.error("Error registrando reproducción:", error); } };
  const openPurchaseModal = () => { setPurchaseError(""); setPurchaseOk(""); const token = localStorage.getItem("authToken"); if (!token) { setPurchaseError("Necesitas iniciar sesión para comprar."); } setShowPurchase(true); };
  const closePurchaseModal = () => { if (purchaseLoading) return; setShowPurchase(false); setPurchaseError(""); setPurchaseOk(""); };
  const generateReceiptPDF = (songData, pricePaid, userEmail, artistLabel) => { const doc = new jsPDF(); doc.setTextColor(40); doc.setFontSize(22); doc.text("Resound Música", 20, 20); doc.setFontSize(16); doc.text("Recibo de Compra Digital", 20, 30); doc.setLineWidth(0.5); doc.line(20, 35, 190, 35); doc.setFontSize(12); doc.text(`Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 50); doc.text(`ID Transacción: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 20, 60); doc.text(`Comprador: ${userEmail}`, 20, 70); doc.setFillColor(240, 240, 240); doc.rect(20, 85, 170, 10, 'F'); doc.setFont("helvetica", "bold"); doc.text("Concepto", 25, 91); doc.text("Artista", 100, 91); doc.text("Precio", 160, 91); doc.setFont("helvetica", "normal"); const songName = songData.nomCancion || songData.titulo || "Canción"; let finalPrice = pricePaid; if (finalPrice === null || finalPrice === "") { finalPrice = songData.precio || 0; } const priceString = formatPrice(finalPrice); doc.text(songName, 25, 105); doc.text(artistLabel, 100, 105); doc.text(priceString, 160, 105); doc.line(20, 115, 190, 115); doc.setFont("helvetica", "bold"); doc.text(`TOTAL PAGADO: ${priceString}`, 130, 125); doc.setFont("helvetica", "italic"); doc.setFontSize(10); doc.text("Gracias por apoyar la música independiente.", 20, 150); doc.text("Este es un comprobante digital generado automáticamente.", 20, 155); doc.save(`Recibo_Resound_${songName.replace(/\s+/g, '_')}.pdf`); };
  const handleConfirmPurchase = async () => { if (!song) return; const token = localStorage.getItem("authToken"); if (!token) { setPurchaseError("Inicia sesión para completar la compra."); return; } const email = getStoredUserEmail(); if (!email) { setPurchaseError("No se pudo leer el email del usuario."); return; } const amount = payAmount === "" || payAmount === null ? null : Number.parseFloat(payAmount); if (payAmount !== "" && (Number.isNaN(amount) || amount < 0)) { setPurchaseError("Introduce un importe válido (0€ o más)."); return; } setPurchaseLoading(true); setPurchaseError(""); setPurchaseOk(""); try { await purchaseSong({ songId: song.id, pricePaid: amount, userEmail: email, }); setPurchaseOk("Compra realizada correctamente. ¡Disfruta tu pista!"); const artistLabel = artistName || getArtistLabel(song); generateReceiptPDF(song, amount, email, artistLabel); } catch (error) { const msg = error?.response?.data?.detail || error?.message || "No se pudo completar la compra."; setPurchaseError(msg); } finally { setPurchaseLoading(false); } };

  if (!songId || loading || err || !song) return null; // (Simplificado para el ejemplo, mantén tus returns de error/loading originales)
  
  // Variables de renderizado
  const coverPath = song.imgPortada || song.imgSencillo || song.portada || song.coverPath || null;
  const coverSrc = coverPath ? fileURL(coverPath) : "https://via.placeholder.com/500x500?text=Sin+portada";
  const albumTitle = album?.titulo || song.albumTitulo || "Sencillo";
  const artistLabel = artistName || getArtistLabel(song);
  let publishedLabel = null; 
  if (song.date) { const d = new Date(song.date); const formatted = Number.isNaN(d.getTime()) ? String(song.date) : d.toLocaleDateString("es-ES"); publishedLabel = `Publicado el ${formatted}`; }

  return (
    <div className="public-song-detail">
      {onBack && (
        <button type="button" className="btn-link back-button" onClick={onBack}>
          ← Volver al catálogo
        </button>
      )}

      <div className="public-song-layout">
        {/* ... (Imagen y detalles igual que antes) ... */}
        <div className="public-song-cover">
            <img src={coverSrc} alt={song.nomCancion || song.titulo} />
        </div>

        <div className="public-song-info">
          <h2 className="song-title">{song.nomCancion || song.titulo}</h2>
          <div className="song-artist">por {artistLabel}</div>
          <div className="song-album">del álbum {albumTitle}</div>
          {publishedLabel && <div className="song-date">{publishedLabel}</div>}

          <div className="song-stats">
            <button type="button" className="btn-play" onClick={handlePlayClick}>▶ Reproducir</button>
            <span className="plays-label">Reproducciones: {plays}</span>
          </div>

          <div className="song-purchase">
            <button type="button" className="btn-primary" onClick={openPurchaseModal}>
              Comprar pista digital {formatPrice(song.precio)}
            </button>
            <p className="purchase-note">Recibirás la pista y las futuras descargas ligadas a tu cuenta.</p>
          </div>

          {/* 3. BOTONES DE ACCIÓN: AÑADIR A PLAYLIST Y COMPARTIR */}
          <div className="song-playlist-actions" style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowAddToPlaylist(true)}
            >
              ➕ Añadir a playlist
            </button>

            <button
              type="button"
              className="btn-secondary"
              style={{ backgroundColor: "#e0f2fe", borderColor: "#bae6fd", color: "#0284c7" }}
              onClick={() => setShowShareModal(true)}
            >
              📢 Compartir
            </button>
          </div>
        </div>
      </div>

      {/* MODALES EXISTENTES */}
      {showPurchase && (
          /* ... tu modal de compra ... */
          <div className="modal-backdrop"><div className="modal-card"><h3>Confirmar compra</h3><p className="modal-subtitle">{song.nomCancion} · {artistLabel}</p><label className="modal-label" htmlFor="song-price">Importe a pagar (€)</label><input id="song-price" type="number" min="0" step="0.01" className="modal-input" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Usar precio por defecto" /><p className="modal-hint">Puedes dejarlo en blanco para usar el precio actual ({formatPrice(song.precio)}).</p>{purchaseError && <div className="modal-error">{purchaseError}</div>}{purchaseOk && <div className="modal-success">{purchaseOk}</div>}<div className="modal-actions"><button type="button" className="btn-secondary" onClick={closePurchaseModal} disabled={purchaseLoading}>Cerrar</button><button type="button" className="btn-primary" onClick={handleConfirmPurchase} disabled={purchaseLoading || purchaseOk}>{purchaseLoading ? "Procesando…" : "Pagar y comprar"}</button></div></div></div>
      )}
      {showAddToPlaylist && song && (
        <AddToPlaylistModal song={song} onClose={() => setShowAddToPlaylist(false)} />
      )}

      {/* 4. MODAL DE COMPARTIR */}
      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={`Escucha "${song.nomCancion || 'Canción'}" de ${artistLabel} en Resound Música`}
        url={window.location.href} 
      />
    </div>
  );
};

export default PublicSongDetail;