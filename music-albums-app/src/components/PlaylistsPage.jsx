import { useEffect, useState } from "react";
import {
  fetchPlaylists,
  createPlaylist,
  deletePlaylist,
} from "../services/api";
import PlaylistFormModal from "./PlaylistFormModal";
import "../styles/Playlists.css";

export default function PlaylistsPage({ onOpenPlaylist }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showModal, setShowModal] = useState(false);

  const loadPlaylists = () => {
    setLoading(true);
    fetchPlaylists()
      .then(setPlaylists)
      .catch(() => setErr("No se han podido cargar tus playlists"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPlaylists();
  }, []);

  const handleCreate = async (data) => {
    await createPlaylist({ ...data, songIds: [] });
    setShowModal(false);
    loadPlaylists();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres borrar esta playlist?")) return;
    await deletePlaylist(id);
    loadPlaylists();
  };

  if (loading) return <p>Cargando playlists…</p>;
  if (err) return <p className="text-danger">{err}</p>;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Mis playlists</h1>
        <button
          className="btn-primary"
          type="button"
          onClick={() => setShowModal(true)}
        >
          Nueva playlist
        </button>
      </header>

      {playlists.length === 0 ? (
        <p>Todavía no tienes ninguna playlist. Crea la primera ✨</p>
      ) : (
        <div className="playlist-grid">
          {playlists.map((pl) => (
            <article key={pl.id} className="playlist-card">
              <button
                type="button"
                className="playlist-card-main"
                onClick={() => onOpenPlaylist(pl.id)}
              >
                <h2>{pl.name}</h2>
                {pl.description && (
                  <p className="playlist-desc">{pl.description}</p>
                )}
                <p className="playlist-meta">{pl.song_ids.length} canciones</p>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleDelete(pl.id)}
              >
                Borrar
              </button>
            </article>
          ))}
        </div>
      )}

      {showModal && (
        <PlaylistFormModal
          title="Crear nueva playlist"
          onSubmit={handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
