import React from "react";

function Particles() {
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${10 + i * 12}%`,
            animationDuration: `${8 + i * 2}s`,
            animationDelay: `${i * 1.2}s`,
            width: i % 2 === 0 ? "4px" : "3px",
            height: i % 2 === 0 ? "4px" : "3px",
          }}
        />
      ))}
    </>
  );
}

function LeftPanel() {
  return (
    <div className="left">
      <div className="leftBg">
        <div className="bgGrid" />
        <div className="bgOrb bgOrb1" />
        <div className="bgOrb bgOrb2" />
        <div className="bgOrb bgOrb3" />
        <Particles />
      </div>
      <div className="leftInner">
        <div className="leftLogo">
          <div className="leftLogoIcon">
            <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
              <line x1="15" y1="4" x2="15" y2="26" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <line x1="7" y1="8" x2="23" y2="8" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M7 8 L4 15 Q7 18 10 15 Z" fill="rgba(255,255,255,0.35)" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M23 8 L20 14 Q23 17 26 14 Z" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M10 26 H20" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="leftLogoText">
            Legal<span>Lens</span>
          </span>
        </div>
        <h1 className="leftTagline">
          Justice Through
          <br />
          <span>Intelligence</span>
        </h1>
        <p className="leftDesc">A unified case management platform for law enforcement teams, forensic experts, and legal investigators.</p>
        <div className="leftFeatures">
          <div className="leftFeatureItem">
            <div className="leftFeatureDot" />
            <span>End-to-end case lifecycle management</span>
          </div>

          <div className="leftFeatureItem">
            <div className="leftFeatureDot" />
            <span>Tamper-proof digital evidence chain</span>
          </div>

          <div className="leftFeatureItem">
            <div className="leftFeatureDot" />
            <span>Role-based access & audit trails</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleSelection({ onRoleSelect }) {
  return (
    <>
      <LeftPanel />
      <div className="right">
        <div className="formContainer">
          <div className="roleSelectHeader">
            <div className="roleSelectBadge">SECURE PORTAL</div>
            <h2 className="roleSelectTitle">Select Your Role</h2>
            <p className="roleSelectSubtitle">Choose your role to access LegalLens</p>
          </div>

          <div className="rolesGrid">
            <div className="roleCard" onClick={() => onRoleSelect("police")}>
              <div className="roleIcon policeIcon">
                <i className="bx bx-shield-quarter" />
              </div>
              <h3>Police Officer</h3>
              <p>Case tracking & evidence management</p>
            </div>

            <div className="roleCard" onClick={() => onRoleSelect("forensic")}>
              <div className="roleIcon forensicIcon">
                <i className="bx bx-file-find" />
              </div>
              <h3>Forensic Officer</h3>
              <p>Analyze & verify digital evidence</p>
            </div>

            <div className="roleCard" onClick={() => onRoleSelect("admin")}>
              <div className="roleIcon adminIcon">
                <i className="bx bx-user-check" />
              </div>
              <h3>Supervising Officer</h3>
              <p>Manage users & system settings</p>
            </div>

            <div className="roleCard" onClick={() => onRoleSelect("lead")}>
              <div className="roleIcon leadIcon">
                <i className="bx bx-search-alt" />
              </div>
              <h3>Lead Investigator</h3>
              <p>Lead investigations & team oversight</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default RoleSelection;
export { LeftPanel };
