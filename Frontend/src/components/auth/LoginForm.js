import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { LeftPanel } from "./RoleSelection.js";

function LoginForm({ role, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  const titles = {
    police: "Police Officer",
    forensic: "Forensic Officer",
    admin: "Administrator",
    lead: "Lead Investigator",
  };

  const getRoleTitle = () => {
    return titles[role] || "User";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/login", { email, password });
      if (res.data.message === "Login successful") {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/dashboard");
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Login failed");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await api.post("/password-reset-request-public", { email });
      setError(res.data.message || " Please sign in and change it from Settings.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset password right now.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <LeftPanel />
      <div className="right">
        <div className="formContainer">
          <button className="backButton" onClick={onBack}>
            <i className="bx bx-arrow-back"></i> Change Role
          </button>

          <header className="formHeader">
            <h2>Welcome Back</h2>
            <p>
              Sign in as <strong style={{ color: "#4f46e5" }}>{getRoleTitle()}</strong>
            </p>
          </header>

          <div className="securityNotice">
            <i className="bx bx-shield-quarter"></i>
            <div>
              <strong>Secure Login</strong>
              <p>Your credentials are encrypted and protected</p>
            </div>
          </div>

          <form className="loginForm" onSubmit={handleSubmit}>
            <div className="inputGroup">
              <label>Email Address</label>
              <div className="inputWrapper">
                <input type="email" placeholder="your.email@agency.gov" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <i className="bx bx-envelope"></i>
              </div>
            </div>

            <div className="inputGroup">
              <label>Password</label>
              <div className="inputWrapper">
                <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <i className="bx bx-lock"></i>
              </div>
            </div>

            {error && <p className="error">{error}</p>}

            <div className="formUtils">
              <div></div>
              <button type="button" onClick={handleForgotPassword} disabled={sending} className="forgotPasswordBtn">
                {sending ? "Sending..." : "Forgot password?"}
              </button>
            </div>

            <button type="submit" className="submitBtn">
              Sign In Securely
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default LoginForm;
