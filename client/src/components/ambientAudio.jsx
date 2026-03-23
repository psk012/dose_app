import React, { useEffect, useRef } from 'react';

export const AUDIO_TRACKS = [
    { id: "none", name: "No Sound", url: "" },
    // These now point to local files you must download into client/public/audio/
    { id: "rain", name: "Gentle Rain", url: "/audio/rain.mp3" },
    { id: "forest", name: "Deep Forest", url: "/audio/forest.mp3" },
    { id: "fireplace", name: "Fireplace", url: "/audio/fireplace.mp3" },
    { id: "white_noise", name: "White Noise", url: "/audio/white_noise.mp3" },
];

function AmbientAudio({ isPlaying, trackId }) {
    const audioRef = useRef(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying && trackId !== "none") {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Audio playback failed (browser autoplay block without interaction):", error);
                });
            }
        } else {
            audio.pause();
        }
    }, [isPlaying, trackId]);

    // When the track changes, we need to handle loading and conditionally play again if needed
    useEffect(() => {
        const audio = audioRef.current;
        if (audio && trackId !== "none") {
            audio.load(); // Reload the new source
            if (isPlaying) {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => console.log("Failed to play on track switch:", e));
                }
            }
        }
    }, [trackId]);

    const track = AUDIO_TRACKS.find(t => t.id === trackId);

    if (!track || track.id === "none") return null;

    return <audio ref={audioRef} src={track.url} loop />;
}

export default AmbientAudio;
