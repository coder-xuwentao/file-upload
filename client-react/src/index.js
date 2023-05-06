import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
//   <React.StrictMode> // 这玩意会导致渲染两次App
    <App />
//   </React.StrictMode>
);

