import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/global.css';
import TeacherPage from './pages/TeacherPage';
import StudentPage from './pages/StudentPage';
import HomePage from './pages/HomePage';
import KickedOutPage from './pages/KickedOutPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/teacher" element={<TeacherPage />} />
        <Route path="/student" element={<StudentPage />} />
        <Route path="/kicked-out" element={<KickedOutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

