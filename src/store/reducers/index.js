import { combineReducers } from 'redux';
import calendarReducer from './calendarReducer';

const rootReducer = combineReducers({
    calendar: calendarReducer
});

export default rootReducer;