import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sparkles, ArrowLeft, Loader2, Tag } from 'lucide-react';
import { categorizeMessage, summarizeMessage } from '../api/aiApi.js';
import { getMessage } from '../api/gmailApi.js';
import EmailDetail from '../components/EmailDetail.jsx';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import SummaryBox from '../components/SummaryBox.jsx';

export default function EmailPage() {
  const { id } = useParams();
  const [message, setMessage] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [workingType, setWorkingType] = useState(''); // 'summary' or 'category'
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getMessage(id);
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function runSummary() {
    setWorking(true);
    setWorkingType('summary');
    setError(null);
    try {
      const data = await summarizeMessage(id);
      setSummary(data.summary);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWorking(false);
      setWorkingType('');
    }
  }

  async function runCategory() {
    setWorking(true);
    setWorkingType('category');
    setError(null);
    try {
      await categorizeMessage(id);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWorking(false);
      setWorkingType('');
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  return (
    <section className="page" style={{ animation: 'scaleIn 0.3s ease-out' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link className="text-link" to="/inbox" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Back to Inbox
        </Link>
      </div>

      <ErrorState message={error} />

      {loading ? (
        <LoadingState label="Loading message content" />
      ) : message ? (
        <>
          <div className="button-row" style={{ justifyContent: 'flex-end', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
            <button 
              className="primary-button" 
              type="button" 
              onClick={runSummary} 
              disabled={working}
              style={{ height: '40px' }}
            >
              {working && workingType === 'summary' ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Sparkles size={14} />
              )}
              {working && workingType === 'summary' ? 'Synthesizing...' : 'Summarize with AI'}
            </button>
            
            <button 
              className="secondary-button" 
              type="button" 
              onClick={runCategory} 
              disabled={working}
              style={{ height: '40px' }}
            >
              {working && workingType === 'category' ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Tag size={14} />
              )}
              {working && workingType === 'category' ? 'Classifying...' : 'Recategorize'}
            </button>
          </div>

          {summary ? (
            <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
              <SummaryBox title="AI Email Summary" summary={summary} />
            </div>
          ) : null}

          <EmailDetail message={message} />
        </>
      ) : (
        <ErrorState message="Could not retrieve the email message details." />
      )}
    </section>
  );
}
