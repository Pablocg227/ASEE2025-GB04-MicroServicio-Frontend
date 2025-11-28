import { useState, useEffect } from 'react';
import { fetchUserByEmail } from '../services/api';

const useUser = (email) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }

    const loadUser = async () => {
      try {
        setLoading(true);
        const data = await fetchUserByEmail(email);
        setUser(data);
        setError(null);
      } catch (err) {
        setError(err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [email]);

  return { user, loading, error };
};

export default useUser;