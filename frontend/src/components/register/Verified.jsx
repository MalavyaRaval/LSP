import React from "react";
import { Link } from "react-router-dom";

const Verified = () => {
  return (
    <div style={{ padding: 20 }}>
      <h2>Your email is verified</h2>
      <p>
        Your account has been verified successfully. You can now{" "}
        <Link to="/register/login">login</Link>.
      </p>
    </div>
  );
};

export default Verified;
