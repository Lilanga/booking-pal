import { Route, HashRouter } from 'react-router-dom';
import React from 'react';
import { Provider } from 'react-redux';
import { createRoot } from 'react-dom/client';
import App from './app';
import store from './store';

import '../static/sass/main.scss';

window.location.hash = 'status';

class MainComponent extends React.Component {
  render() {
    return (
   <Provider store={store}> 
    <HashRouter>
      <Route path="/" component={App}/>
    </HashRouter>
    </Provider>
    );
  }
}

const root = createRoot(document.getElementById('react-root'));
root.render(<MainComponent />);
