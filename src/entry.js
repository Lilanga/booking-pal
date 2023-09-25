import { Route, HashRouter } from 'react-router-dom';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';

import '../static/sass/main.scss';

window.location.hash = 'status';

class MainComponent extends React.Component {
  render() {
    return <HashRouter>
      <Route path="/" component={App}/>
    </HashRouter>;
  }
}

const root = createRoot(document.getElementById('react-root'));
root.render(<MainComponent />);
