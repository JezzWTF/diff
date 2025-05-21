import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import DiffChecker from './components/DiffChecker';

function App() {
  return (
    <ThemeProvider>
      <Layout>
        <DiffChecker />
      </Layout>
    </ThemeProvider>
  );
}

export default App;