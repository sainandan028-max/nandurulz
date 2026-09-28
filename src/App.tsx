import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MoviePage from './pages/Movie';
import AdminHelper from './pages/AdminHelper';
import { AuthProvider } from './contexts/AuthContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movie/:movieId" element={<MoviePage />} />
          <Route path="/admin-helper" element={<AdminHelper />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
