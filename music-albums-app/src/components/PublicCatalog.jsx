import React, { useEffect, useState } from "react";
import {
  fetchPublicSongs,
  fetchPublicAlbums,
  fetchArtistsByEmails,
} from "../services/api";

import { fileURL } from "../utils/helpers";

// Intenta sacar un texto bonito para el artista, sea como sea que venga del backend
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

const PublicCatalog = ({ onSelectSong }) => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        // 1) Canciones y álbumes en paralelo
        const [songsData, albumsData] = await Promise.all([
          fetchPublicSongs(),
          fetchPublicAlbums().catch((err) => {
            console.error("Error cargando álbumes públicos:", err);
            return [];
          }),
        ]);

        const songsArray = Array.isArray(songsData) ? songsData : [];
        const albumsArray = Array.isArray(albumsData) ? albumsData : [];

        // 2) Mapa idAlbum -> álbum
        const albumMap = new Map();
        albumsArray.forEach((album) => {
          if (album && typeof album.id !== "undefined") {
            albumMap.set(album.id, album);
          }
        });

        // 3) Emails únicos de artistas que aparecen en las canciones
        const emailSet = new Set();
        songsArray.forEach((song) => {
          if (Array.isArray(song.artistas_emails)) {
            song.artistas_emails.forEach((email) => {
              if (email) emailSet.add(email);
            });
          }
        });

        let artistsByEmail = {};
        if (emailSet.size > 0) {
          artistsByEmail = await fetchArtistsByEmails(Array.from(emailSet));
        }

        // 4) Enriquecer canciones con:
        //    - song.artistas = [{ nickname: display_name, email }]
        //    - song.album = objeto álbum (para sacar título)
        const enrichedSongs = songsArray.map((song) => {
          const songEmails = Array.isArray(song.artistas_emails)
            ? song.artistas_emails
            : [];

          const artistas = songEmails.map((email) => {
            const artist = artistsByEmail[email];
            if (artist) {
              return {
                nickname:
                  artist.display_name ||
                  artist.nombre_artistico ||
                  artist.email ||
                  email,
                email: artist.email || email,
              };
            }

            // Fallback: derivar nombre a partir del correo
            const fallbackName =
              typeof email === "string" ? email.split("@")[0] : "Artista";
            return {
              nickname: fallbackName,
              email,
            };
          });

          const album =
            song.idAlbum != null ? albumMap.get(song.idAlbum) || null : null;

          return {
            ...song,
            artistas,
            album,
          };
        });

        setSongs(enrichedSongs);
      } catch (err) {
        console.error("Error cargando canciones públicas:", err);
        setError("No se pudieron cargar las canciones.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <div className="loading">Cargando catálogo…</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (songs.length === 0) {
    return (
      <div className="no-content">Todavía no hay canciones disponibles.</div>
    );
  }

  return (
    <div className="public-view">
      <div className="public-header">
        <h2>Explorar canciones</h2>
        <p className="public-subtitle">
          Descubre canciones independientes. Haz clic en una portada para ver
          los detalles de la pista.
        </p>
      </div>

      <div className="content-grid public-grid">
        {songs.map((song) => {
          const coverPath =
            song.imgPortada ||
            song.imgSencillo ||
            song.portada ||
            song.coverPath ||
            null;

          const coverSrc = coverPath
            ? fileURL(coverPath)
            : "https://via.placeholder.com/300x300?text=Sin+portada";

          const albumTitle =
            (song.album && song.album.titulo) || song.albumTitulo || "Sencillo";

          return (
            <button
              key={song.id}
              className="content-card public-card"
              type="button"
              onClick={() => onSelectSong && onSelectSong(song.id)}
            >
              <div className="public-card-image-wrapper">
                <img
                  src={coverSrc}
                  alt={song.nomCancion || song.titulo || "Portada de canción"}
                  className="public-card-image"
                />
              </div>
              <div className="public-card-body">
                <div className="public-card-title">
                  {song.nomCancion || song.titulo || "Canción sin título"}
                </div>
                <div className="public-card-artist">{getArtistLabel(song)}</div>
                <div className="public-card-album">{albumTitle}</div>
                {/* OJO: aquí NO mostramos precio, por lo que comentabas */}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PublicCatalog;
