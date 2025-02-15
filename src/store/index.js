const { createStore, applyMiddleware } = require('redux');
const { logger } = require('redux-logger');
const thunk = require('redux-thunk').default;
const rootReducer = require('./reducers').default;

const store = createStore(rootReducer, applyMiddleware(thunk, logger));
export default store;