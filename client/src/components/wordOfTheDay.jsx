import React, { useMemo } from 'react';

const words = [
    { word: "Sonder", phonetic: "/ˈsɒndə/", meaning: "The realisation that each random passerby has a life as vivid and complex as your own." },
    { word: "Petrichor", phonetic: "/ˈpɛtrɪkɔː/", meaning: "The pleasant, earthy smell after rain." },
    { word: "Eudaimonia", phonetic: "/juːdɪˈməʊnɪə/", meaning: "A state of deep well-being, human flourishing, and a life well-lived." },
    { word: "Meraki", phonetic: "/mɛˈrɑːkɪ/", meaning: "To do something with soul, creativity, or love." },
    { word: "Equanimity", phonetic: "/ˌɛkwəˈnɪmɪti/", meaning: "Mental calmness, composure, and evenness of temper." },
    { word: "Ephemeral", phonetic: "/ɪˈfɛmərəl/", meaning: "Lasting for a very short time; transient but beautiful." },
    { word: "Respite", phonetic: "/ˈrɛspaɪt/", meaning: "A short period of rest or relief from something difficult or unpleasant." },
    { word: "Philocaly", phonetic: "/fɪˈlɒkəli/", meaning: "The love of beauty in all its forms." },
    { word: "Ataraxia", phonetic: "/ˌætəˈræksiə/", meaning: "A state of serene calmness and untroubled mind." },
    { word: "Ubuntu", phonetic: "/ʊˈbʊntʊ/", meaning: "I am because we are; honouring the universal bond of sharing that connects all humanity." },
    { word: "Halcyon", phonetic: "/ˈhælsiən/", meaning: "Denoting a period of time in the past that was idyllically happy and peaceful." },
    { word: "Soliloquy", phonetic: "/səˈlɪləkwi/", meaning: "The act of speaking one's thoughts aloud when by oneself." },
    { word: "Kalon", phonetic: "/kəˈlɒn/", meaning: "Beauty that is more than skin deep." },
    { word: "Vellichor", phonetic: "/ˈvɛlɪkɔː/", meaning: "The strange wistfulness of used bookshops." },
    { word: "Apricity", phonetic: "/æˈprɪsɪti/", meaning: "The warmth of the sun in winter." },
];

function WordOfTheDay() {
    const todayWord = useMemo(() => {
        // Calculate the day of the year (1-365/366)
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        
        // Pick a word based on the day of the year
        const index = dayOfYear % words.length;
        return words[index];
    }, []);

    return (
        <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out">
            <p className="font-headline italic text-on-surface/90 text-lg flex items-baseline gap-2">
                Word of the Day: 
                <span className="font-semibold text-on-surface text-xl">{todayWord.word}</span>
                <span className="text-on-surface/50 text-sm font-body font-normal not-italic">{todayWord.phonetic}</span>
            </p>
            <p className="font-body text-on-surface/70 flex items-start gap-2">
                <span className="material-symbols-outlined text-[1rem] translate-y-0.5 text-primary">auto_stories</span>
                {todayWord.meaning}
            </p>
        </div>
    );
}

export default WordOfTheDay;
