import React, { useState } from "react";
import { saveToken } from "./auth";

export default function Login({ onLogin, goRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const api = "http://localhost:8000/auth/login";

  const handleLogin = async () => {
    const res = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.token) {
      saveToken(data.token);
      onLogin();
    } else {
      alert(data.error || "Login failed");
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card shadow-lg p-4 rounded-4">
        <h2 className="text-center fw-bold mb-4">Welcome Back</h2>
        <p className="text-center text-muted mb-4">
          Login to continue to your AI-powered ToDo
        </p>

        <div className="mb-3">
          <label className="form-label fw-semibold">Email</label>
          <input
            className="form-control form-control-lg rounded-3"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="form-label fw-semibold">Password</label>
          <input
            type="password"
            className="form-control form-control-lg rounded-3"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          className="btn btn-dark btn-lg w-100 rounded-3 mb-3"
          onClick={handleLogin}
        >
          Login
        </button>

        <p className="text-center mt-3">
          Don’t have an account?{" "}
          <span
            className="text-primary fw-semibold"
            style={{ cursor: "pointer" }}
            onClick={() => goRegister && goRegister()}
          >
            Register
          </span>
        </p>
      </div>

      <style>{`
        .auth-bg {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #e3ffe7 0%, #d9e7ff 100%);
          padding: 20px;
        }

        .auth-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
        }
      `}</style>
    </div>
  );
}
