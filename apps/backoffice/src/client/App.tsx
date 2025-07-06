import React from 'react';
import { Dashboard } from './pages/Dashboard';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1>On se met bien - Back Office</h1>
      </header>
      <main>
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
