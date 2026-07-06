import { useAuth } from '../hooks/useAuth.js';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '../api/authApi.js';

export default function AuthDebug() {
  const { user, loading, error } = useAuth();
  const [rawResponse, setRawResponse] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    async function fetchRaw() {
      try {
        const data = await getCurrentUser();
        setRawResponse(JSON.stringify(data, null, 2));
      } catch (err) {
        setFetchError(err.message);
      }
    }
    fetchRaw();
  }, []);

  return (
    <section className="page">
      <h1>Authentication Debug Page</h1>
      
      <div style={{ display: 'grid', gap: '24px', marginTop: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h2>useAuth Hook Status</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}><strong>Loading:</strong></td>
                <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{loading ? 'Yes' : 'No'}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}><strong>Error:</strong></td>
                <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{error || 'None'}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}><strong>User Object:</strong></td>
                <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{user ? 'Present' : 'Null'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {user && (
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h2>User Object Details</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', width: '30%' }}><strong>ID:</strong></td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{user.id}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}><strong>Google Email:</strong></td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{user.google_email}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}><strong>Name:</strong></td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{user.name || '(not set)'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}><strong>Avatar URL:</strong></td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
                    {user.avatar_url ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={user.avatar_url} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{user.avatar_url}</span>
                      </div>
                    ) : '(not set)'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}><strong>Created At:</strong></td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{user.created_at}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px' }}><strong>Updated At:</strong></td>
                  <td style={{ padding: '8px' }}>{user.updated_at}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="glass-panel" style={{ padding: '20px' }}>
          <h2>Raw API Response</h2>
          {fetchError ? (
            <div style={{ color: 'var(--error-color)', padding: '12px', background: 'var(--error-bg)', borderRadius: '6px' }}>
              Error: {fetchError}
            </div>
          ) : rawResponse ? (
            <pre style={{ 
              background: 'var(--bg-secondary)', 
              padding: '16px', 
              borderRadius: '6px', 
              overflow: 'auto',
              fontSize: '12px',
              lineHeight: '1.5'
            }}>
              {rawResponse}
            </pre>
          ) : (
            <div>Loading...</div>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <h2>Browser Info</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', width: '30%' }}><strong>Backend URL:</strong></td>
                <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}><strong>Cookies Enabled:</strong></td>
                <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{navigator.cookieEnabled ? 'Yes' : 'No'}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px' }}><strong>User Agent:</strong></td>
                <td style={{ padding: '8px', fontSize: '11px' }}>{navigator.userAgent}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
