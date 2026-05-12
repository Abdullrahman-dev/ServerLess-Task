import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CreatePoll from './pages/CreatePoll';
import VotePage from './pages/VotePage';
import ResultsPage from './pages/ResultsPage';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<CreatePoll />} />
          <Route path="/poll/:id" element={<VotePage />} />
          <Route path="/poll/:id/results" element={<ResultsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;