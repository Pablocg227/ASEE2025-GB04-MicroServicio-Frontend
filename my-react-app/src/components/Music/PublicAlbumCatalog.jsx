// src/components/PublicAlbumCatalog.jsx
import React, { useEffect, useState } from "react";
import { fetchPublicAlbums, fetchArtistsByEmails } from "../../services/musicApi";

import { fileURL, formatDate, truncateString } from "../../utils/helpers";
import "../../styles/MusicGlobal.css";

const PublicAlbumCatalog = ({ onSelectAlbum }) => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAlbums = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await fetchPublicAlbums();
        const albumsArray = Array.isArray(data) ? data : [];

        // Recogemos todos los emails de artistas de todos los álbumes
        const emailSet = new Set();
        albumsArray.forEach((album) => {
          if (Array.isArray(album.artistas_emails)) {
            album.artistas_emails.forEach((email) => {
              if (email) emailSet.add(email);
            });
          }
        });

        let artistsByEmail = {};
        if (emailSet.size > 0) {
          artistsByEmail = await fetchArtistsByEmails(Array.from(emailSet));
        }

        const enrichedAlbums = albumsArray.map((album) => {
          const emails = Array.isArray(album.artistas_emails)
            ? album.artistas_emails
            : [];

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
            return typeof email === "string" ? email.split("@")[0] : "Artista";
          });

          const artistas_display = artistas.join(", ");

          return {
            ...album,
            artistas,
            artistas_display,
          };
        });

        setAlbums(enrichedAlbums);
      } catch (err) {
        console.error("Error cargando álbumes públicos:", err);
        setError("No se han podido cargar los álbumes.");
      } finally {
        setLoading(false);
      }
    };

    loadAlbums();
  }, []);

  if (loading) return <div className="loading">Cargando álbumes…</div>;
  if (error) return <div className="no-content">{error}</div>;

  if (!albums.length) {
    return (
      <section className="public-section">
        <h2>Explorar álbumes</h2>
        <p className="public-subtitle">Todavía no hay álbumes publicados.</p>
      </section>
    );
  }

  return (
    <section className="public-section">
      <h2>Explorar álbumes</h2>
      <p className="public-subtitle">
        Descubre álbumes completos. Haz clic en una portada para ver los
        detalles.
      </p>

      <div className="public-grid">
        {albums.map((album) => {
          const cover =
            fileURL(album.imgPortada || album.portada || album.coverPath) ||
            "/placeholder-album.png";

          const rawGenres = album.genre || album.genres || [];
          const genresText = Array.isArray(rawGenres)
            ? rawGenres.join(", ")
            : String(rawGenres || "");

          const artistNames =
            album.artistas_display ||
            (Array.isArray(album.artistas) ? album.artistas.join(", ") : "");

          return (
            <button
              key={album.id}
              type="button"
              className="public-card"
              onClick={() => onSelectAlbum && onSelectAlbum(album.id)}
            >
              <div className="public-cover-wrapper">
                <img
                  src={cover}
                  alt={album.titulo || "Álbum sin título"}
                  className="public-cover"
                />
              </div>
              <div className="public-card-body">
                <h3 className="public-title">
                  {truncateString(album.titulo || "Álbum sin título", 40)}
                </h3>
                {artistNames && (
                  <p className="public-artist">
                    {truncateString(artistNames, 50)}
                  </p>
                )}
                {album.date && (
                  <p className="public-meta">
                    Lanzado el {formatDate(album.date)}
                  </p>
                )}
                {genresText && (
                  <p className="public-meta">Géneros: {genresText}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default PublicAlbumCatalog;
