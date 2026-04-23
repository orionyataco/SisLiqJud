import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CalculadoraJudicial from './components/CalculadoraJudicial';
import HistoricoCalculos from './components/HistoricoCalculos';

function App() {
  return (
    <Router>
      <div className="app-main">
        <Routes>
          <Route path="/" element={<CalculadoraJudicial />} />
          <Route path="/historico" element={<HistoricoCalculos />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
