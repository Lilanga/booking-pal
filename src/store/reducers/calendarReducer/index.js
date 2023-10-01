const {GET_EVENTS} = require('../../actions/types');
const { nextEvent, currentEvent } = require('../../../util');
const initialState = {
    events: []
    };

    export default (state = initialState, action) => {
        switch (action.type) {
            case GET_EVENTS:
                return {
                    ...state,
                    events: action.payload,
                    nextEvent: nextEvent(action.payload),
                    currentEvent: currentEvent(action.payload)
                };
            default:
                return state;
        }
    };