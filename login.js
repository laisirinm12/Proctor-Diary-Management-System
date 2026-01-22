async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const error = document.getElementById("error");
  
    if (!username || !password) {
      error.textContent = "All fields required";
      return;
    }
  
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        error.textContent = data.msg || "Login failed";
        return;
      }
  
      // ✅ STORE AUTH DATA
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("username", data.username);
  
      // Redirect
      window.location.href = "index.html";
    } catch {
      error.textContent = "Server error";
    }
  }
  