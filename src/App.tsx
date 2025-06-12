import { ThemeProvider } from './context/ThemeContext';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DiffViewerPage from './pages/DiffViewerPage';

function App() {
  return (
    <ThemeProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/diff-viewer" element={<DiffViewerPage />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
