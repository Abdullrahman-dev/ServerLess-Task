import { useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

export default function CreatePoll() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [pollId, setPollId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => setOptions([...options, '']);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const filteredOptions = options.filter(opt => opt.trim() !== '');

    if (filteredOptions.length < 2) {
      setError('Please provide at least 2 options.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/polls`, {
        question,
        options: filteredOptions
      });
      setPollId(response.data.pollId);
    } catch (err) {
      console.error(err);
      setError('Failed to create poll. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (pollId) {
    const voteUrl = `${window.location.origin}/poll/${pollId}`;
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h2 style={{ color: 'var(--success-color)' }}>Poll Created Successfully! 🎉</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Scan the QR code to vote</p>
        
        <div className="qr-container">
          <QRCodeSVG value={voteUrl} size={200} />
        </div>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: '5px' }}>Or share this link:</p>
        <a href={voteUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color)', wordBreak: 'break-all' }}>
          {voteUrl}
        </a>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Create a New Poll</h2>
      {error && <div style={{ color: 'var(--error-color)', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Question</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          placeholder="e.g., What is your favorite programming language?"
        />

        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Options</label>
        {options.map((option, index) => (
          <input
            key={index}
            type="text"
            value={option}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
            required={index < 2}
          />
        ))}
        
        <button type="button" className="btn-secondary" onClick={addOption}>
          + Add another option
        </button>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating Poll...' : 'Create Poll'}
        </button>
      </form>
    </div>
  );
}