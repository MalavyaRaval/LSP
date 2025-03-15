import React, { useEffect } from "react";
import { LuCheck } from "react-icons/lu";
import { MdDeleteOutline } from "react-icons/md";

const ToastMessage = ({ isShow, message, type }) => {
  useEffect(() => {
    const timeoutId = setTimeout(() => {}, 3000);

    return () => {
      clearTimeout(timeoutId);
    };
  });

  const containerStyle = {
    position: "absolute",
    top: "20px",
    right: "6px",
    transition: "all 0.4s",
    opacity: isShow ? 1 : 0,
  };

  const boxStyle = {
    minWidth: "200px",
    backgroundColor: type === "delete" ? "#fff5f5" : "#f0fff4",
    border: "1px solid",
    borderColor: type === "delete" ? "#f5c6cb" : "#c3e6cb",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    borderRadius: "0.375rem",
    display: "flex",
    alignItems: "center",
    padding: "0.5rem 1rem",
  };

  const iconContainerStyle = {
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    backgroundColor: type === "delete" ? "#f5c6cb" : "#c3e6cb",
  };

  const textStyle = {
    marginLeft: "0.75rem",
    flex: 1,
    color: "#4a5568",
    fontSize: "0.875rem",
  };

  const buttonStyle = {
    color: "#4a5568",
    fontSize: "0.875rem",
    cursor: "pointer",
  };

  return (
    <div style={containerStyle}>
      <div style={boxStyle}>
        <div style={iconContainerStyle}>
          {type === "delete" ? (
            <MdDeleteOutline className="text-xl" style={{ color: "#e3342f" }} />
          ) : (
            <LuCheck className="text-xl" style={{ color: "#38a169" }} />
          )}
        </div>
        <p style={textStyle}>{message}</p>
      </div>
    </div>
  );
};

export default ToastMessage;
