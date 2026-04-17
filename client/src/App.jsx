import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import Home from "./pages/home";
import Login from "./pages/login";
import Signup from "./pages/signup";
import ForgotPassword from "./pages/forgotPassword";
import ResetPage from "./pages/resetpage";
import Welcome from "./pages/welcome";
import JournalPage from "./pages/journalpage";
import FocusPage from "./pages/focuspage";
import ClearMind from "./pages/clearMind";
import Insights from "./pages/insights";
import MyComfortZone from "./pages/safetynet";
import VerifyEmail from "./pages/verifyEmail";
import Onboarding from "./pages/onboarding";
import SetupComplete from "./pages/setupComplete";
import ProtectedRoute from "./components/protectedroute";
import { useAuth } from "./context/AuthContext";
import { fetchJournals } from "./api/api";
import { ProgressBar } from "./components/progressBar";

function App() {
  const { token } = useAuth();

  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [phase, setPhase] = useState("Breathe In");

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

      const elapsed = 36 - time;
      const cycleTime = elapsed % 12;

      if (cycleTime < 4) {
        setPhase("Breathe In");
      } else if (cycleTime < 8) {
        setPhase("Hold");
      } else {
        setPhase("Breathe Out");
      }

      if (time <= 0) {
        clearInterval(interval);
        setIsRunning(false);
        setTimeLeft(36);
        setPhase("Breathe In");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  function startReset() {
    if (isRunning) return;
    setPhase("Breathe In"); // Explicitly set start phase
    setTimeLeft(36);
    setIsRunning(true);
  }

  return (
    <>
      <ProgressBar />
      <Routes>
        {/* 🔒 PROTECTED ROUTES */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
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
          path="/insights"
          element={
            <ProtectedRoute>
              <Insights />
            </ProtectedRoute>
          }
        />

        <Route
          path="/clear-mind"
          element={
            <ProtectedRoute>
              <ClearMind />
            </ProtectedRoute>
          }
        />

        <Route
          path="/comfort-zone"
          element={
            <ProtectedRoute>
              <MyComfortZone />
            </ProtectedRoute>
          }
        />

        <Route
          path="/safetynet"
          element={
            <ProtectedRoute>
              <MyComfortZone />
            </ProtectedRoute>
          }
        />

        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        <Route
          path="/setup-complete"
          element={
            <ProtectedRoute>
              <SetupComplete />
            </ProtectedRoute>
          }
        />

        {/* 🌐 PUBLIC ROUTES */}
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
    </>
  );
}

export default App;
