import React from 'react';
import SongList from './SongList';

const AlbumCard = ({ album }) => {
    return (
        <div className="album-card">
            <h2>{album.title}</h2>
            <p>Release Date: {album.releaseDate}</p>
            <SongList songs={album.songs} />
        </div>
    );
};

export default AlbumCard;