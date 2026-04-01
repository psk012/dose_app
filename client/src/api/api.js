const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://dose-backend-ezck.onrender.com/api";

export async function apiFetch(url, options = {}, retries = 2, backoff = 500) {
  const timeout = options.timeout || 10000; // 10s default
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (retries > 0 && (error.name === 'AbortError' || error.message.includes('fetch'))) {
      await new Promise((resolve) => setTimeout(resolve, backoff));
      return apiFetch(url, options, retries - 1, backoff * 2);
    }
    if (error.name === 'AbortError') {
      throw new Error("Request timed out. Please try again.");
    }
    throw new Error(error.message || "Network error. Please check your connection.");
  }
}

// ─── AUTH ────────────────────────────────────────────

export async function loginUser(email, password) {
  const res = await apiFetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data; // { token }
}

export async function sendOtp(email) {
  const res = await apiFetch(`${API_BASE}/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to send OTP");
  return data;
}

export async function verifyOtp(email, otp) {
  const res = await apiFetch(`${API_BASE}/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Verification failed");
  return data;
}

export async function signupUser(email, password, signupToken) {
  const res = await apiFetch(`${API_BASE}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, signupToken }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Signup failed");
  }

  return data; // { message: "User created" }
}

export async function verifyEmail(token) {
  const res = await apiFetch(`${API_BASE}/verify-email?token=${token}`);
  const data = await res.json();
  if (!res.ok) {
     throw new Error(data.message || "Verification failed");
  }
  return data;
}

// ─── JOURNAL ─────────────────────────────────────────

export async function fetchJournals(token) {
  const res = await apiFetch(`${API_BASE}/journal`, {
    headers: { Authorization: token },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch journals");
  }

  return res.json(); // string[]
}

export async function saveJournal(token, text) {
  const res = await apiFetch(`${API_BASE}/journal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error("Failed to save journal entry");
  }

  return res.json(); // { message: "Saved" }
}

// ─── FOCUS SESSIONS ──────────────────────────────────

export async function logFocusSession(token, workMinutes, breakMinutes) {
  const res = await apiFetch(`${API_BASE}/focus`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ workMinutes, breakMinutes }),
  });

  if (!res.ok) {
    throw new Error("Failed to log focus session");
  }

  return res.json();
}

export async function getFocusStats(token) {
  const res = await apiFetch(`${API_BASE}/focus/stats`, {
    headers: { Authorization: token },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch focus stats");
  }

  return res.json();
}
