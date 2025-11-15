import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Bg from "../images/devotional-john.webp";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (username === "admin" && password === "admin") {
      // Save login
      localStorage.setItem("adminAuth", "true");

      // Trigger App.jsx to update auth state
      window.dispatchEvent(new Event("storage"));

      // Redirect to admin dashboard
      navigate("/admin");
    } else {
      alert("Invalid Username or Password");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.background}></div>
      <div style={styles.card}>
        <h2 style={styles.title}>Admin Login</h2>

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />

          <button type="submit" style={styles.button}>Login</button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { position: "relative", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" },
  background: { position: "absolute", inset: 0, backgroundImage: `url(${Bg})`, backgroundSize: "cover", opacity: 0.2, zIndex: -1 },
  card: { backgroundColor: "#fff", padding: "40px 30px", borderRadius: 12, boxShadow: "0 8px 25px rgba(0,0,0,0.15)", maxWidth: 400, textAlign: "center" },
  title: { marginBottom: 20, fontSize: 24, fontWeight: "bold" },
  form: { display: "flex", flexDirection: "column", gap: 15 },
  input: { padding: 14, fontSize: 16, borderRadius: 8, border: "1px solid #ccc" },
  button: { padding: 14, fontSize: 16, fontWeight: "bold", backgroundColor: "#2980b9", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" },
};

export default AdminLogin;
