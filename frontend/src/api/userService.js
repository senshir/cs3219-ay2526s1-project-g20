const API_BASE = import.meta.env.VITE_USER_SERVICE_URL || "http://localhost:8000"; // adjust to your FastAPI host

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Server error details:", err); // Log the full error
    
    // Handle FastAPI validation errors (err.detail is an array)
    if (Array.isArray(err.detail)) {
      const errorMessages = err.detail.map(e => {
        if (typeof e === 'string') return e;
        if (e.msg) return `${e.loc?.join('.') || 'Field'}: ${e.msg}`;
        return JSON.stringify(e);
      }).join(', ');
      throw new Error(errorMessages || "Validation error");
    }
    
    // Handle string error messages
    if (typeof err.detail === 'string') {
      throw new Error(err.detail);
    }
    
    // Handle object error messages
    if (err.detail && typeof err.detail === 'object') {
      throw new Error(err.detail.message || JSON.stringify(err.detail));
    }
    
    throw new Error(err.message || err.detail || res.statusText || "Unknown error");
  }
  return res.json();
}

export async function registerUser({ username, email, password }) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password })
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Registration failed:", err);
    
    // Handle FastAPI validation errors (err.detail is an array)
    if (Array.isArray(err.detail)) {
      const errorMessages = err.detail.map(e => {
        if (typeof e === 'string') return e;
        if (e.msg) return `${e.loc?.join('.') || 'Field'}: ${e.msg}`;
        return JSON.stringify(e);
      }).join(', ');
      throw new Error(errorMessages || "Registration failed");
    }
    
    // Handle string error messages
    if (typeof err.detail === 'string') {
      throw new Error(err.detail);
    }
    
    throw new Error(err.message || err.detail || "Registration failed");
  }
  const userData = await res.json();

  const loginData = await loginUser(email, password);
  localStorage.setItem("token", loginData.access_token);
  return { user: userData, token: loginData.access_token };
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
