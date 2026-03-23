const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// ─── AUTH ────────────────────────────────────────────

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/login`, {
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

export async function signupUser(email, password) {
  const res = await fetch(`${API_BASE}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Signup failed");
  }

  return data; // { message: "User created" }
}

// ─── JOURNAL ─────────────────────────────────────────

export async function fetchJournals(token) {
  const res = await fetch(`${API_BASE}/journal`, {
    headers: { Authorization: token },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch journals");
  }

  return res.json(); // string[]
}

export async function saveJournal(token, text) {
  const res = await fetch(`${API_BASE}/journal`, {
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
  const res = await fetch(`${API_BASE}/focus`, {
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
  const res = await fetch(`${API_BASE}/focus/stats`, {
    headers: { Authorization: token },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch focus stats");
  }

  return res.json();
}

// ─── TASKS ───────────────────────────────────────────

export async function createTask(token, text, date) {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ text, date }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to create task");
  }

  return data;
}

export async function fetchTasks(token, date) {
  const res = await fetch(`${API_BASE}/tasks?date=${date}`, {
    headers: { Authorization: token },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch tasks");
  }

  return res.json();
}

export async function toggleTask(token, taskId) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: "PATCH",
    headers: { Authorization: token },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to update task");
  }

  return data;
}

export async function deleteTask(token, taskId) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: "DELETE",
    headers: { Authorization: token },
  });

  if (!res.ok) {
    throw new Error("Failed to delete task");
  }

  return res.json();
}

export async function getWrapped(token) {
  const res = await fetch(`${API_BASE}/tasks/wrapped`, {
    headers: { Authorization: token },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch wrapped stats");
  }

  return res.json();
}
