import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import Home from "./pages/home";
import Login from "./pages/login";
import Signup from "./pages/signup";
import ResetPage from "./pages/resetpage";
import JournalPage from "./pages/journalpage";
import FocusPage from "./pages/focuspage";
import TasksPage from "./pages/taskspage";
import VerifyEmail from "./pages/verifyEmail";
import ProtectedRoute from "./components/protectedroute";
import { useAuth } from "./context/AuthContext";
import { fetchJournals } from "./api/api";

function App() {
  const { token } = useAuth();

  const [mood, setMood] = useState("");

  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [phase, setPhase] = useState("Breathe In");

  const [dose, setDose] = useState({
    dopamine: 50,
    oxytocin: 50,
    serotonin: 50,
    endorphin: 50,
  });

  const [entry, setEntry] = useState("");
  const [entries, setEntries] = useState([]);
  const [journalLoading, setJournalLoading] = useState(false);
  const [journalError, setJournalError] = useState("");

  // ✅ Fetch journals with loading + error states
  useEffect(() => {
    if (!token) {
      setEntries([]);
      return;
    }

    setJournalLoading(true);
    setJournalError("");

    fetchJournals(token)
      .then((data) => setEntries(data))
      .catch((err) => setJournalError(err.message))
      .finally(() => setJournalLoading(false));
  }, [token]);

  // ✅ Reset logic with proper cleanup
  useEffect(() => {
    if (!isRunning) return;

    let time = timeLeft;

    const interval = setInterval(() => {
      time--;
      setTimeLeft(time);

      if (time % 6 < 3) {
        setPhase("Breathe In");
      } else {
        setPhase("Breathe Out");
      }

      if (time <= 0) {
        clearInterval(interval);
        setIsRunning(false);
        setTimeLeft(30);
        setPhase("Breathe In");
      }
    }, 1000);

    // ✅ Cleanup: clear interval if component unmounts mid-reset
    return () => clearInterval(interval);
  }, [isRunning]);

  function startReset() {
    if (isRunning) return;
    setTimeLeft(30);
    setIsRunning(true);
  }

  // DOSE update
  function updateDose(selectedMood) {
    let newDose = { ...dose };

    if (selectedMood === "Low") {
      newDose.dopamine += 10;
      newDose.endorphin += 5;
    }

    if (selectedMood === "Heavy") {
      newDose.serotonin += 10;
    }

    if (selectedMood === "Scattered") {
      newDose.dopamine += 5;
    }

    if (selectedMood === "Calm") {
      newDose.oxytocin += 5;
    }

    Object.keys(newDose).forEach((key) => {
      newDose[key] = Math.min(newDose[key], 100);
    });

    setDose(newDose);
  }

  function resetMood() {
    setMood("");
    setDose({
      dopamine: 50,
      oxytocin: 50,
      serotonin: 50,
      endorphin: 50,
    });
  }

  return (
    <Routes>
      {/* 🔒 PROTECTED ROUTES */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home
              mood={mood}
              setMood={setMood}
              updateDose={updateDose}
              resetMood={resetMood}
              isRunning={isRunning}
              timeLeft={timeLeft}
              phase={phase}
              startReset={startReset}
              dose={dose}
              entry={entry}
              setEntry={setEntry}
              setEntries={setEntries}
              entries={entries}
              journalLoading={journalLoading}
              journalError={journalError}
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reset"
        element={
          <ProtectedRoute>
            <ResetPage
              isRunning={isRunning}
              timeLeft={timeLeft}
              phase={phase}
              startReset={startReset}
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/journal"
        element={
          <ProtectedRoute>
            <JournalPage
              entry={entry}
              setEntry={setEntry}
              setEntries={setEntries}
              entries={entries}
              journalLoading={journalLoading}
              journalError={journalError}
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/focus"
        element={
          <ProtectedRoute>
            <FocusPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <TasksPage />
          </ProtectedRoute>
        }
      />

      {/* 🌐 PUBLIC ROUTES */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
    </Routes>
  );
}

export default App;