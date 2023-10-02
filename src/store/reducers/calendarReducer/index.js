const {GET_EVENTS} = require('../../actions/types');
const { nextEvent, currentEvent } = require('../../../util');
const initialState = {
    events: [],
    error: null,
    route: 'status',
    };

    export default (state = initialState, action) => {
        switch (action.type) {
            case GET_EVENTS:
                return {
                    ...state,
                    events: action.payload,
                    nextEvent: nextEvent(action.payload),
                    currentEvent: currentEvent(action.payload),
                    error: null,
                    route: 'status'
                };
            case 'FAILED_EVENT':
                return {
                    ...state,
                    error: action.payload,
                    route: 'check_connection'
                };
            default:
                return state;
        }
    };