const API_BASE = import.meta.env.VITE_USER_SERVICE_URL || "http://localhost:8000"; // adjust to your FastAPI host

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
        console.error("Server error details:", err); // Log the full error
    throw new Error(err.detail || res.statusText || "Unknown error");
  }
  return res.json();
}

export async function registerUser({ username, email, password }) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password })
  });
  return await res.json();
}

export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password })
  });
  const data = await handleResponse(res);
  localStorage.setItem("token", data.access_token);
  console.log(localStorage.getItem("token"));
  return data;
}

export async function getProfile() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function updateUsername(new_username) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/username`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ new_username })
  });
  return handleResponse(res);
}

export async function updatePassword(current_password, new_password) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ current_password, new_password })
  });
  return handleResponse(res);
}
