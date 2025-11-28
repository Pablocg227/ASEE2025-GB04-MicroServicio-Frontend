import { useEffect, useState } from "react";
import {
  fetchPlaylistById,
  removeSongFromPlaylist,
  updatePlaylist,
  fetchSongById,
} from "../../services/musicApi";
import PlaylistFormModal from "./PlaylistFormModal";
import { fileURL } from "../../utils/helpers";
import "../../styles/Playlists.css";

// Aceptamos onPlay
export default function PlaylistDetailPage({
  playlistId,
  onBack,
  onOpenSong,
  onPlay,
}) {
  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  const loadPlaylist = () => {
    setLoading(true);
    fetchPlaylistById(playlistId)
      .then(async (pl) => {
        setPlaylist(pl);

        const loadedSongs = [];
        for (const songId of pl.song_ids) {
          try {
            const s = await fetchSongById(songId);
            loadedSongs.push(s);
          } catch {
            // si alguna falla, la ignoramos
          }
        }
        setSongs(loadedSongs);
      })
      .catch(() => setErr("No se ha podido cargar la playlist"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPlaylist();
  }, [playlistId]);

  const handleRemoveSong = async (songId) => {
    await removeSongFromPlaylist(playlist.id, songId);
    loadPlaylist();
  };

  const handleEdit = async (data) => {
    await updatePlaylist(playlist.id, data);
    setShowEditModal(false);
    loadPlaylist();
  };

  // NUEVO HANDLER: Delegamos al padre (MusicPage)
  const handlePlaySong = (song) => {
    if (onPlay) {
      onPlay(song);
    }
  };

  if (loading) return <p className="loading">Cargando playlist…</p>;
  if (err) return <p className="text-danger">{err}</p>;
  if (!playlist) return <p>Playlist no encontrada</p>;

  // Portada (primera canción)
  const firstSong = songs[0] || null;
  const coverPath =
    firstSong?.imgPortada ||
    firstSong?.imgSencillo ||
    firstSong?.portada ||
    firstSong?.coverPath ||
    null;

  const coverSrc = coverPath
    ? fileURL(coverPath)
    : "https://via.placeholder.com/400x400?text=Playlist";

  return (
    <div className="page playlist-detail-page">
      <button className="link-back" type="button" onClick={onBack}>
        ← Volver a mis playlists
      </button>

      <div className="playlist-detail-layout">
        <div className="playlist-detail-cover">
          <img src={coverSrc} alt={`Portada de ${playlist.name}`} />
        </div>

        <div className="playlist-detail-main">
          <header className="playlist-detail-header">
            <div>
              <h1>{playlist.name}</h1>
              {playlist.description && (
                <p className="playlist-desc">{playlist.description}</p>
              )}
              <p className="playlist-meta">
                {songs.length} {songs.length === 1 ? "canción" : "canciones"}
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary playlist-edit-btn"
              onClick={() => setShowEditModal(true)}
            >
              Editar
            </button>
          </header>

          <section className="playlist-songs-section">
            <h2>Canciones de la playlist</h2>
            {songs.length === 0 ? (
              <p>
                Esta playlist está vacía. Puedes añadir canciones desde la ficha
                de cada canción.
              </p>
            ) : (
              <ul className="playlist-songs">
                {songs.map((song) => (
                  <li key={song.id} className="playlist-song-row">
                    <div className="playlist-song-left">
                      <button
                        type="button"
                        className="playlist-song-play"
                        onClick={() => handlePlaySong(song)}
                      >
                        ▶
                      </button>
                      <div className="playlist-song-info">
                        <span className="playlist-song-title">
                          {song.nomCancion || song.titulo || "Sin título"}
                        </span>
                        {song.artists_display_names && (
                          <span className="playlist-song-artist">
                            {song.artists_display_names.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="playlist-song-actions">
                      {song.precio != null && (
                        <span className="playlist-song-price">
                          {Number(song.precio).toFixed(2)} €
                        </span>
                      )}

                      <button
                        type="button"
                        className="playlist-song-open"
                        onClick={() => onOpenSong && onOpenSong(song.id)}
                      >
                        Ver canción
                      </button>

                      <button
                        type="button"
                        className="btn-link-danger"
                        onClick={() => handleRemoveSong(song.id)}
                      >
                        Quitar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {showEditModal && (
        <PlaylistFormModal
          title="Editar playlist"
          initialData={playlist}
          onSubmit={handleEdit}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
