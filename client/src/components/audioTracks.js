export const AUDIO_TRACKS = [
    { id: "none", name: "No Sound", url: "" },
    { id: "rain", name: "Gentle Rain", url: "/audio/rain.mp3" },
    { id: "forest", name: "Deep Forest", url: "/audio/forest.mp3" },
    { id: "fireplace", name: "Fireplace", url: "/audio/fireplace.mp3" },
    { id: "white_noise", name: "White Noise", url: "/audio/white_noise.mp3" },
];

export function getAudioTrack(trackId) {
    return AUDIO_TRACKS.find((track) => track.id === trackId) || AUDIO_TRACKS[0];
}
