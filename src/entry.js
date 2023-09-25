import { Route, HashRouter } from 'react-router-dom';
import React from 'react';
import { render } from 'react-dom';
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

render(<MainComponent />, document.getElementById('react-root'));
