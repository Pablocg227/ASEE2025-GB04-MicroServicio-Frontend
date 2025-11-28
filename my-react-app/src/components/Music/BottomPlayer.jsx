import React, { useEffect, useRef, useState } from "react";
import { fileURL } from "../../utils/helpers";
import "../../styles/BottomPlayer.css";

const ShuffleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"></path>
  </svg>
);

const PreviousIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"></path>
  </svg>
);

const NextIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"></path>
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 5v14l11-7z"></path>
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
  </svg>
);

const RepeatIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v6z"></path>
  </svg>
);

const VolumeHighIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path>
  </svg>
);

const VolumeMuteIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path d="M7 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path>
    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const BottomPlayer = ({
  song,
  onEnded,
  trigger,
  onNext,
  onPrev,
  isShuffle,
  toggleShuffle,
  isRepeat,
  toggleRepeat,
}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (song && audioRef.current) {
      audioRef.current.src = fileURL(song.archivoMp3);
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error(err));
    }
  }, [song, trigger]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handlePrevClick = () => {
    if (audioRef.current) {
      if (audioRef.current.currentTime > 3) {
        audioRef.current.currentTime = 0;
        return;
      }
    }
    onPrev();
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeekStart = () => setIsDragging(true);

  const handleSeekChange = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  const handleSeekEnd = (e) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setIsDragging(false);
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  if (!song) return null;

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const cover = song.imgPortada || song.portada || song.imgSencillo || null;
  const coverSrc = cover ? fileURL(cover) : "/placeholder-song.png";

  return (
    <div className="bottom-player-container">
      <div className="player-track-info">
        <img src={coverSrc} alt="Portada" className="player-cover" />
        <div className="player-text">
          <span className="player-title">{song.nomCancion || song.titulo}</span>
          <span className="player-artist">
            {song.artistName || "Reproduciendo"}
          </span>
        </div>
      </div>

      <div className="player-center-column">
        <div className="player-controls">
          <button
            className={`btn-player-control ${isShuffle ? "active" : ""}`}
            onClick={toggleShuffle}
            title="Aleatorio"
          >
            <ShuffleIcon />
          </button>

          <button
            className="btn-player-control"
            onClick={handlePrevClick}
            title="Anterior"
          >
            <PreviousIcon />
          </button>

          <button
            onClick={togglePlay}
            className={`btn-player-control main-play ${isPlaying ? "is-playing" : ""}`}
            title={isPlaying ? "Pausar" : "Reproducir"}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          <button
            className="btn-player-control"
            onClick={onNext}
            title="Siguiente"
          >
            <NextIcon />
          </button>

          <button
            className={`btn-player-control ${isRepeat ? "active" : ""}`}
            onClick={toggleRepeat}
            title="Repetir"
          >
            <RepeatIcon />
          </button>
        </div>

        <div className="player-progress-bar-wrapper">
          <span className="time-text">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onPointerDown={handleSeekStart}
            onChange={handleSeekChange}
            onPointerUp={handleSeekEnd}
            className="youtube-progress-bar"
            style={{ "--seek-before-width": `${progressPercent}%` }}
          />
          <span className="time-text">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-volume">
        <button
          className="btn-player-control"
          onClick={() => {
            const newVol = volume === 0 ? 1 : 0;
            setVolume(newVol);
            if (audioRef.current) audioRef.current.volume = newVol;
          }}
        >
          {volume === 0 ? <VolumeMuteIcon /> : <VolumeHighIcon />}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
    </div>
  );
};

export default BottomPlayer;
