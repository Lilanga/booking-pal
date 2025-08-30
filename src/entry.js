import { Routes, Route, HashRouter } from 'react-router-dom';
import React from 'react';
import { Provider } from 'react-redux';
import { createRoot } from 'react-dom/client';
import App from './app';
import Status from './components/status';
import Schedule from './components/schedule';
import CheckConnection from './components/check_connection';
import store from './store';

import '../static/sass/main.scss';

class MainComponent extends React.Component {
  render() {
    return (
   <Provider store={store}> 
    <HashRouter>
      <Routes>
        <Route path="/" element={<App><Status /></App>}/>
        <Route path="/status" element={<App><Status /></App>}/>
        <Route path="/schedule" element={<App><Schedule /></App>}/>
        <Route path="/check_connection" element={<App><CheckConnection /></App>}/>
      </Routes>
    </HashRouter>
    </Provider>
    );
  }
}

const root = createRoot(document.getElementById('react-root'));
root.render(<MainComponent />);
