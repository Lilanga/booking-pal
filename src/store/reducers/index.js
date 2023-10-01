const { combineReducers } = require('redux');
const calendarReducer = require('./calendarReducer').default;

const rootReducer = combineReducers({
    calendar: calendarReducer
    });

export default rootReducer;