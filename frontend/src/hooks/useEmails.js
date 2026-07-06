import { useCallback, useEffect, useState } from 'react';
import { getMessages } from '../api/gmailApi.js';

export function useEmails(params) {
  const [messages, setMessages] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMessages(params);
      setMessages(data.messages || []);
      setCount(data.count || 0);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    load();
  }, [load]);

  return { messages, count, loading, error, reload: load };
}

