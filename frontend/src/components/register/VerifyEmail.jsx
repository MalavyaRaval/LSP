import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Redirecting to verify...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('No token provided.');
      return;
    }

    // Build backend verify URL and perform a full same-tab navigation so the server
    // verifies and then redirects to the login page. This avoids duplicate/XHR calls
    // that can consume the token and show transient errors.
    const backendBase = import.meta.env.VITE_APP_BASE_URL || window.location.origin;
    const verifyUrl = `${backendBase.replace(/\/$/, '')}/api/auth/verify?token=${token}`;

    // Use replace so history doesn't keep the intermediate URL
    window.location.replace(verifyUrl);
  }, [searchParams]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Email verification</h2>
      <p>{status}</p>
    </div>
  );
};

export default VerifyEmail;
