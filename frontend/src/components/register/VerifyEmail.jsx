import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosInstance';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verifying...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('No token provided.');
      return;
    }

    async function verify() {
      try {
        // Call backend verify endpoint
        const res = await axios.get(`/api/auth/verify?token=${token}`);
        // backend redirects to frontend /verified; but if it returns JSON, handle it
        if (res.status === 200 || res.status === 302) {
          // redirect to verified page
          navigate('/verified');
        } else {
          setStatus('Verification completed. Please try logging in.');
        }
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'Verification failed.';
        setStatus(msg);
      }
    }

    verify();
  }, [searchParams, navigate]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Email verification</h2>
      <p>{status}</p>
    </div>
  );
};

export default VerifyEmail;
