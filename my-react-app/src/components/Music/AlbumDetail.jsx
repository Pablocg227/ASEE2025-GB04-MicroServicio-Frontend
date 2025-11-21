import React, { useState, useEffect } from 'react';
import { fetchAlbumDetails, fetchAlbumSongs } from '../../services/musicApi';
import SongList from './SongList';
import EditModal from './EditModal';
import '../../styles/AlbumDetail.css';

const AlbumDetail = ({ albumId, onBack }) => {
    const [album, setAlbum] = useState(null);
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        loadAlbumData();
    }, [albumId]);

    const loadAlbumData = async () => {
        try {
            setLoading(true);
            const [albumData, songsData] = await Promise.all([
                fetchAlbumDetails(albumId),
                fetchAlbumSongs(albumId)
            ]);
            setAlbum(albumData);
            setSongs(songsData);
        } catch (error) {
            console.error('Error loading album:', error);
            alert('Error al cargar los detalles del álbum');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Cargando...</div>;
    }

    if (!album) {
        return <div className="error">Álbum no encontrado</div>;
    }

    return (
        <div className="album-detail">
            <button className="btn-back" onClick={onBack}>
                ← Volver
            </button>

            <div className="album-header">
                <img 
                    src={album.portada || '/placeholder-album.png'} 
                    alt={album.titulo}
                    className="album-cover-large"
                />
                <div className="album-info">
                    <h1>{album.titulo}</h1>
                    <p className="artist-name">{album.artista_nombre}</p>
                    <p className="release-date">
                        Fecha de lanzamiento: {new Date(album.fecha_lanzamiento).toLocaleDateString()}
                    </p>
                    <button 
                        className="btn-edit"
                        onClick={() => setShowEditModal(true)}
                    >
                        Editar álbum
                    </button>
                </div>
            </div>

            <div className="songs-section">
                <h2>Canciones</h2>
                <SongList 
                    songs={songs} 
                    albumId={albumId}
                    onUpdate={loadAlbumData}
                />
            </div>

            {showEditModal && (
                <EditModal
                    type="album"
                    data={album}
                    onClose={() => setShowEditModal(false)}
                    onSave={loadAlbumData}
                />
            )}
        </div>
    );
};

export default AlbumDetail;