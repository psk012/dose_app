import Mood from "../components/mood";
import Reset from "../components/reset";
import Dose from "../components/dose";
import Journal from "../components/journal";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/navbar";
import WordOfTheDay from "../components/wordOfTheDay";
import LettingGo from "../components/lettingGo";

function Home({
    mood,
    setMood,
    updateDose,
    isRunning,
    timeLeft,
    phase,
    startReset,
    dose,
    entry,
    setEntry,
    setEntries,
    entries,
    journalLoading,
    journalError,
}) {
    const { logout } = useAuth();

    return (
        <div className="bg-surface min-h-screen vellum-texture relative overflow-hidden">
            {/* Decorative blurs */}
            <div className="absolute -top-20 -right-20 w-64 h-64 md:w-96 md:h-96 bg-primary-container/10 rounded-full blur-3xl md:blur-[100px] pointer-events-none opacity-100 md:opacity-60"></div>
            <div className="absolute top-1/2 -left-32 w-80 h-80 md:w-96 md:h-96 bg-tertiary-container/10 rounded-full blur-3xl md:blur-[100px] pointer-events-none opacity-100 md:opacity-60"></div>

            <div className="relative max-w-lg md:max-w-5xl lg:max-w-7xl mx-auto px-6 py-8 md:py-12">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-container/30 flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-primary-fixed text-xl">spa</span>
                        </div>
                        <span className="font-headline italic text-lg text-on-primary-fixed">The Living Journal</span>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-on-surface/20 text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Logout
                    </button>
                </header>

                {/* Greeting */}
                <div className="mb-8">
                    <h1 className="font-handwriting text-5xl text-on-surface leading-tight mb-2">
                        Hello, beautiful soul.
                    </h1>
                    <div className="mt-4">
                        <WordOfTheDay />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-start gap-0 md:gap-8">
                    <Navbar />

                    {/* Content sections */}
                    <div className="flex-1 w-full space-y-6 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
                        <div className="md:col-span-1 lg:col-span-1 md:row-span-1">
                            <Mood mood={mood} setMood={setMood} updateDose={updateDose} />
                        </div>

                        <div className="md:col-span-1 lg:col-span-1 md:row-span-1">
                            <Reset
                                isRunning={isRunning}
                                timeLeft={timeLeft}
                                phase={phase}
                                startReset={startReset}
                            />
                        </div>

                        <div className="md:col-span-2 lg:col-span-1 md:row-span-1">
                            <Dose dose={dose} />
                        </div>

                        <div className="md:col-span-2 lg:col-span-2 md:row-span-2">
                            <Journal
                                entry={entry}
                                setEntry={setEntry}
                                setEntries={setEntries}
                                entries={entries}
                                journalLoading={journalLoading}
                                journalError={journalError}
                            />
                        </div>

                        <div className="md:col-span-2 lg:col-span-1 md:row-span-1 h-full">
                            <LettingGo />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
