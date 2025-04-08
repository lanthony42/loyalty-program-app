import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

const AvatarDropdown = ({ avatarUrl, logout, user, setRole, Role }) => {
  const [open, setOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const availableRoles = Object.keys(Role).filter(r => Role[r] <= Role[user.baseRole]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setRoleMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="avatar-dropdown"
      style={{ position: "relative", display: "inline-block" }}
      ref={dropdownRef}
    >
      <img
        src={avatarUrl}
        alt="Avatar"
        onClick={() => setOpen(!open)}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          objectFit: "cover",
          cursor: "pointer"
        }}
      />
      {open && (
        <div
          className="dropdown-menu"
          style={{
            position: "absolute",
            top: "50px",
            right: -55,
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            zIndex: 1000,
            minWidth: "160px",
            padding: "8px 0"
          }}
        >
          <Link to="/edit-profile" style={itemStyle}>Profile</Link>

          <button
            style={itemStyle}
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
          >
            Change Role
          </button>

          {roleMenuOpen && (
            <div style={{
              marginLeft: "10px",
              marginTop: "5px",
              borderTop: "1px solid #eee",
              paddingTop: "5px"
            }}>
            {availableRoles.map(role => (
            <button
                key={role}
                onClick={() => {
                setRole(role);
                setRoleMenuOpen(false);
                setOpen(false);
                }}
                style={{
                ...itemStyle,
                paddingLeft: "20px",
                fontSize: "0.9rem",
                backgroundColor: "white",
                fontWeight: user.role === role ? "bold" : "normal"
                }}
            >
                {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
            ))}
            </div>
          )}

          <button onClick={logout} style={{ ...itemStyle, border: "none", background: "none", width: "100%", textAlign: "left" }}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

const itemStyle = {
  padding: "10px 15px",
  textDecoration: "none",
  color: "#333",
  display: "block",
  cursor: "pointer",
  width: "100%",
  background: "none",
  border: "none",
  textAlign: "left",
  fontSize: 14
};

export default AvatarDropdown;
