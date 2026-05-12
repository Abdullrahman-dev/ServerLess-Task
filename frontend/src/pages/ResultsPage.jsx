import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function ResultsPage() {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [integrationMsg, setIntegrationMsg] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/polls/${id}`);
        setPoll(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load results.');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  const handleSendIntegration = async () => {
    if (!email) {
      setIntegrationMsg('⚠️ Please enter an email address.');
      return;
    }

    setSending(true);
    setIntegrationMsg('');
    
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/polls/${id}/send`, { email });
      setIntegrationMsg('✅ Results sent successfully!');
      setEmail('');
    } catch (err) {
      console.error(err);
      setIntegrationMsg('❌ Failed to send. Check server configuration.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading results...</div>;
  if (error || !poll) return <div style={{ color: 'var(--error-color)', textAlign: 'center' }}>{error}</div>;

  return (
    <div className="card">
      <h2 style={{ marginBottom: '5px' }}>Poll Results</h2>
      <h3 style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontWeight: 'normal' }}>{poll.question}</h3>

      <div style={{ marginBottom: '30px' }}>
        {poll.options.map((option) => {
          const percentage = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
          return (
            <div key={option.id} style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span>{option.text}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{option.votes} votes ({percentage}%)</span>
              </div>
              <div style={{ width: '100%', backgroundColor: 'var(--input-bg)', borderRadius: '6px', height: '12px', overflow: 'hidden' }}>
                <div style={{ width: `${percentage}%`, backgroundColor: 'var(--accent-color)', height: '100%', transition: 'width 0.8s ease-out' }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', margin: '20px 0', padding: '15px', backgroundColor: 'var(--input-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Total Votes:</span> <strong style={{ fontSize: '18px', marginLeft: '5px' }}>{poll.totalVotes}</strong>
      </div>

      <hr style={{ borderColor: 'var(--border-color)', margin: '30px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h4 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>Share Results</h4>
        <input 
          type="email" 
          placeholder="Enter email to receive results..." 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn-success" onClick={handleSendIntegration} disabled={sending}>
          {sending ? 'Sending...' : 'Send Results (Email Integration)'}
        </button>
        {integrationMsg && <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '14px', color: integrationMsg.includes('✅') ? 'var(--success-color)' : 'var(--error-color)' }}>{integrationMsg}</div>}
      </div>
    </div>
  );
}