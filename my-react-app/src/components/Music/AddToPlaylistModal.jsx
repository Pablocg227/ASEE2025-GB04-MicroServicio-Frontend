// src/components/AddToPlaylistModal.jsx
import { useEffect, useState } from "react";
import { fetchPlaylists, addSongToPlaylist } from "../../services/musicApi";
import "../../styles/EditModal.css";

export default function AddToPlaylistModal({ song, onClose }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchPlaylists()
      .then((data) => {
        setPlaylists(data);
        if (data.length === 0) {
          setErr(
            "No tienes ninguna playlist todavía. Crea una en la sección 'Mis playlists'.",
          );
        }
      })
      .catch((error) => {
        console.error(error);
        // Si es 401 probablemente no ha iniciado sesión
        setErr(
          "No se han podido cargar tus playlists. Asegúrate de haber iniciado sesión como oyente.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (playlistId) => {
    try {
      setErr("");
      setSuccessMsg("");
      await addSongToPlaylist(playlistId, song.id);
      setSuccessMsg("Canción añadida a la playlist correctamente ✅");
    } catch (error) {
      console.error(error);
      if (error?.response?.status === 401) {
        setErr("Debes iniciar sesión para añadir canciones a playlists.");
      } else if (error?.response?.data?.detail) {
        setErr(error.response.data.detail);
      } else {
        setErr("No se ha podido añadir la canción a la playlist.");
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Añadir "{song.nomCancion}" a playlist</h2>

        {loading && <p>Cargando tus playlists…</p>}

        {!loading && (
          <>
            {err && <p className="upload-error">{err}</p>}
            {successMsg && <p className="upload-success">{successMsg}</p>}

            {playlists.length > 0 && (
              <ul className="playlist-chooser">
                {playlists.map((pl) => (
                  <li key={pl.id} className="playlist-chooser-item">
                    <button
                      type="button"
                      className="btn-save"
                      onClick={() => handleAdd(pl.id)}
                    >
                      {pl.name}{" "}
                      <span className="playlist-chooser-meta">
                        ({pl.song_ids.length} canciones)
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <div className="modal-actions" style={{ marginTop: "16px" }}>
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
