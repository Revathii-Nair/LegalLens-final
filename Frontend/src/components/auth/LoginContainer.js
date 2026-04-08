import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import RoleSelection from "./RoleSelection.js";
import LoginForm from "./LoginForm.js";

function LoginContainer() {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleBack = () => {
    setSelectedRole(null);
  };

  return (
    <div className="loginPage">
      {!selectedRole ? (
        <RoleSelection onRoleSelect={handleRoleSelect} />
      ) : (
        <LoginForm role={selectedRole} onBack={handleBack} />
      )}
    </div>
  );
}

export default LoginContainer;
