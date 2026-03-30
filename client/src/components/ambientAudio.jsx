import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export const AUDIO_TRACKS = [
    { id: "none", name: "No Sound", url: "" },
    { id: "rain", name: "Gentle Rain", url: "/audio/rain.mp3" },
    { id: "forest", name: "Deep Forest", url: "/audio/forest.mp3" },
    { id: "fireplace", name: "Fireplace", url: "/audio/fireplace.mp3" },
    { id: "white_noise", name: "White Noise", url: "/audio/white_noise.mp3" },
];

const AmbientAudio = forwardRef(function AmbientAudio({ isPlaying, trackId }, ref) {
    const audioRef = useRef(null);

    // Expose a method so the parent can trigger play from a user gesture (tap/click)
    // This satisfies mobile browser autoplay policies
    useImperativeHandle(ref, () => ({
        userPlay() {
            const audio = audioRef.current;
            if (!audio || trackId === "none") return;
            audio.load();
            const p = audio.play();
            if (p) p.catch(() => {});
        },
        userStop() {
            const audio = audioRef.current;
            if (audio) audio.pause();
        }
    }));

    // Sync play/pause state with isPlaying prop
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying && trackId !== "none") {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Autoplay blocked — will be unlocked via userPlay() from a tap
                });
            }
        } else {
            audio.pause();
        }
    }, [isPlaying, trackId]);

    // Reload source when track changes mid-session
    useEffect(() => {
        const audio = audioRef.current;
        if (audio && trackId !== "none") {
            audio.load();
            if (isPlaying) {
                const p = audio.play();
                if (p) p.catch(() => {});
            }
        }
    }, [trackId]);

    const track = AUDIO_TRACKS.find(t => t.id === trackId);

    if (!track || track.id === "none") return null;

    return <audio ref={audioRef} src={track.url} loop preload="auto" />;
});

export default AmbientAudio;
