import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MoviePage from './pages/Movie';
import AdminHelper from './pages/AdminHelper';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movie/:movieId" element={<MoviePage />} />
        <Route path="/admin-helper" element={<AdminHelper />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
