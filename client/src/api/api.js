export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export async function apiFetch(url, options = {}, retries = 2, backoff = 500) {
  const timeout = options.timeout || 15000; // 15s default — enough for Render cold starts
  
  // Do not automatically retry POST/PUT/DELETE requests
  const isIdempotent = !options.method || options.method.toUpperCase() === 'GET';
  const effectiveRetries = isIdempotent ? retries : 0;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (effectiveRetries > 0 && (error.name === 'AbortError' || error.message.includes('fetch'))) {
      await new Promise((resolve) => setTimeout(resolve, backoff));
      return apiFetch(url, options, effectiveRetries - 1, backoff * 2);
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
    timeout: 30000, // 30s — backend now awaits real SMTP delivery
  });
  const data = await res.json();
  if (!res.ok) {
    // 502 = email delivery failed on server side
    if (res.status === 502) {
      throw new Error("Email delivery failed. Please try again in a moment.");
    }
    throw new Error(data.message || "Failed to send OTP");
  }
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

  return data; // { message, token }
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

// ─── MY COMFORT ZONE ───────────────────────────────────────

export async function setupComfortZone(token, contacts) {
  const res = await apiFetch(`${API_BASE}/comfort-zone/setup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ contacts }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to set up My Comfort Zone");
  return data;
}

export async function requestComfortZoneEmailOtp(token, email) {
  const res = await apiFetch(`${API_BASE}/comfort-zone/contacts/otp/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ email }),
    timeout: 30000,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to send email code");
  return data;
}

export async function requestComfortZonePhoneOtp(token, phone) {
  const res = await apiFetch(`${API_BASE}/comfort-zone/contacts/otp/phone`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ phone }),
    timeout: 30000,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to send phone code");
  return data;
}

export async function verifyComfortZoneEmailOtp(token, email, otp) {
  const res = await apiFetch(`${API_BASE}/comfort-zone/contacts/verify/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to verify email");
  return data;
}

export async function verifyComfortZonePhoneOtp(token, phone, otp) {
  const res = await apiFetch(`${API_BASE}/comfort-zone/contacts/verify/phone`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ phone, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to verify phone");
  return data;
}

export async function addComfortZoneContact(token, contact) {
  const res = await apiFetch(`${API_BASE}/comfort-zone/contacts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify(contact),
    timeout: 30000,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to add contact");
  return data;
}

export async function deleteComfortZoneContact(token, contactId) {
  const res = await apiFetch(`${API_BASE}/comfort-zone/contacts/${contactId}`, {
    method: "DELETE",
    headers: { Authorization: token },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to remove contact");
  return data;
}

export async function getComfortZoneConfig(token) {
  const res = await apiFetch(`${API_BASE}/comfort-zone/config`, {
    headers: { Authorization: token },
  });
  if (!res.ok) throw new Error("Failed to fetch My Comfort Zone config");
  return res.json();
}

export async function updateComfortZoneConfig(token, config) {
  const res = await apiFetch(`${API_BASE}/comfort-zone/config`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify(config),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update My Comfort Zone");
  return data;
}

export async function updateComfortZoneContacts(token, contacts) {
  const res = await apiFetch(`${API_BASE}/comfort-zone/contacts`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ contacts }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update contacts");
  return data;
}

export async function getComfortZoneStatus(token) {
  const res = await apiFetch(`${API_BASE}/comfort-zone/status`, {
    headers: { Authorization: token },
  });
  if (!res.ok) throw new Error("Failed to fetch My Comfort Zone status");
  return res.json();
}

export async function pauseComfortZone(token, days) {
  const res = await apiFetch(`${API_BASE}/comfort-zone/pause`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ days }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to pause My Comfort Zone");
  return data;
}

export async function resumeComfortZone(token) {
  const res = await apiFetch(`${API_BASE}/comfort-zone/resume`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to resume My Comfort Zone");
  return data;
}

export async function getComfortZoneAuditLog(token) {
  const res = await apiFetch(`${API_BASE}/comfort-zone/audit-log`, {
    headers: { Authorization: token },
  });
  if (!res.ok) throw new Error("Failed to fetch audit log");
  return res.json();
}





