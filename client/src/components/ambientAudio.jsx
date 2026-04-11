import { useCallback, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { getAudioTrack } from "./audioTracks";

let activeAmbientAudio = null;

function resolvePublicAudioUrl(url) {
    if (!url || typeof window === "undefined") return "";
    return new URL(url, window.location.origin).href;
}

function getPlaybackErrorMessage(error) {
    if (error?.name === "NotAllowedError") {
        return "Your browser blocked the ambient sound. Tap Start Focus again to allow audio.";
    }

    if (error?.name === "NotSupportedError") {
        return "This browser could not read the selected ambient sound file.";
    }

    return "Ambient sound could not start. Please try again or choose another sound.";
}

const AmbientAudio = forwardRef(function AmbientAudio({
    isPlaying = false,
    trackId = "none",
    volume = 0.45,
    onStatusChange,
    onError,
}, ref) {
    const audioRef = useRef(null);
    const trackIdRef = useRef(trackId);
    const volumeRef = useRef(volume);

    const emitStatus = useCallback((status) => {
        onStatusChange?.(status);
    }, [onStatusChange]);

    const reportError = useCallback((error) => {
        const message = getPlaybackErrorMessage(error);
        console.error("Ambient audio playback failed:", error);
        onError?.(message, error);
        emitStatus("error");
    }, [emitStatus, onError]);

    const getAudioElement = useCallback(() => {
        if (typeof Audio === "undefined") return null;

        if (!audioRef.current) {
            const audio = new Audio();
            audio.loop = true;
            audio.preload = "auto";
            audioRef.current = audio;
        }

        return audioRef.current;
    }, []);

    const pauseOtherAmbientAudio = useCallback((audio) => {
        if (activeAmbientAudio && activeAmbientAudio !== audio) {
            activeAmbientAudio.pause();
            activeAmbientAudio.currentTime = 0;
        }

        activeAmbientAudio = audio;
    }, []);

    const pause = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.pause();
        if (activeAmbientAudio === audio) {
            activeAmbientAudio = null;
        }

        emitStatus("paused");
    }, [emitStatus]);

    const stop = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.pause();
        audio.currentTime = 0;
        if (activeAmbientAudio === audio) {
            activeAmbientAudio = null;
        }

        emitStatus("idle");
    }, [emitStatus]);

    const play = useCallback(async (nextTrackId = trackIdRef.current) => {
        const track = getAudioTrack(nextTrackId);

        if (!track || track.id === "none" || !track.url) {
            stop();
            return { ok: false, reason: "no-track" };
        }

        const audio = getAudioElement();
        if (!audio) {
            const error = new Error("Audio is not available in this browser context.");
            reportError(error);
            return { ok: false, error };
        }

        pauseOtherAmbientAudio(audio);
        audio.loop = true;
        audio.preload = "auto";
        audio.volume = volumeRef.current;

        const nextSrc = resolvePublicAudioUrl(track.url);
        if (audio.src !== nextSrc) {
            audio.pause();
            audio.src = nextSrc;
            audio.load();
        }

        try {
            emitStatus("loading");
            await audio.play();
            emitStatus("playing");
            return { ok: true };
        } catch (error) {
            if (activeAmbientAudio === audio) {
                activeAmbientAudio = null;
            }

            audio.pause();
            reportError(error);
            return { ok: false, error };
        }
    }, [emitStatus, getAudioElement, pauseOtherAmbientAudio, reportError, stop]);

    useImperativeHandle(ref, () => ({
        play,
        pause,
        stop,
        userPlay: play,
        userStop: stop,
        getAudioElement: () => audioRef.current,
    }), [pause, play, stop]);

    useEffect(() => {
        trackIdRef.current = trackId;
    }, [trackId]);

    useEffect(() => {
        volumeRef.current = volume;
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    useEffect(() => {
        if (trackId === "none") {
            stop();
            return;
        }

        if (!isPlaying) {
            pause();
        }
    }, [isPlaying, pause, stop, trackId]);

    useEffect(() => {
        return () => {
            const audio = audioRef.current;
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
                if (activeAmbientAudio === audio) {
                    activeAmbientAudio = null;
                }
            }
            audioRef.current = null;
        };
    }, []);

    return null;
});

export default AmbientAudio;
