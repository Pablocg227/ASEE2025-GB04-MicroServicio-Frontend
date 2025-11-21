import React from 'react';
import AlbumList from './AlbumList';

const Artist = ({ artist, albums }) => {
    return (
        <div className="artist">
            <h1>{artist.name}</h1>
            <AlbumList albums={albums} />
        </div>
    );
};

export default Artist;