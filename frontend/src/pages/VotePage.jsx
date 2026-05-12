import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function VotePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/polls/${id}`);
        setPoll(response.data);
      } catch (err) {
        console.error(err);
        setError('Poll not found or connection error.');
      } finally {
        setLoading(false);
      }
    };
    fetchPoll();
  }, [id]);

  const handleVote = async (e) => {
    e.preventDefault();
    if (!selectedOption) {
      setError('Please select an option before voting.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/polls/${id}/vote`, { optionId: selectedOption });
      navigate(`/poll/${id}/results`);
    } catch (err) {
      console.error(err);
      setError('Failed to submit your vote.');
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading poll details...</div>;
  if (error && !poll) return <div style={{ color: 'var(--error-color)', textAlign: 'center' }}>{error}</div>;

  return (
    <div className="card">
      <h2 style={{ marginBottom: '25px' }}>{poll.question}</h2>
      {error && <div style={{ color: 'var(--error-color)', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}

      <form onSubmit={handleVote}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
          {poll.options.map((option) => (
            <label 
              key={option.id} 
              style={{ 
                padding: '15px', 
                border: `1px solid ${selectedOption === option.id ? 'var(--accent-color)' : 'var(--border-color)'}`, 
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: selectedOption === option.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--input-bg)',
                transition: 'all 0.2s'
              }}
            >
              <input
                type="radio"
                name="pollOption"
                value={option.id}
                onChange={(e) => setSelectedOption(e.target.value)}
                style={{ marginRight: '10px', accentColor: 'var(--accent-color)' }}
              />
              {option.text}
            </label>
          ))}
        </div>

        <button type="submit" className="btn-primary" disabled={submitting || !selectedOption}>
          {submitting ? 'Submitting...' : 'Submit Vote'}
        </button>
      </form>
    </div>
  );
}