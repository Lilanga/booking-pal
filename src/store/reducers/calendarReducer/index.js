const {GET_EVENTS, GET_EVENTS_REQUEST, FAILED_EVENT} = require('../../actions/types');
const { nextEvent, currentEvent } = require('../../../util');
const initialState = {
    events: [],
    error: null,
    route: 'status',
    isLoading: false,
    };

// biome-ignore lint/style/useDefaultParameterLast: defalut parameter applies to reducer initialisation only
export  default (state = initialState, action) => {
        switch (action.type) {
            case GET_EVENTS:
                return {
                    ...state,
                    events: action.payload,
                    nextEvent: nextEvent(action.payload),
                    currentEvent: currentEvent(action.payload),
                    error: null,
                    isLoading: false,
                    route: 'status'
                };
            case GET_EVENTS_REQUEST:
                return {
                    ...state,
                    isLoading: true,
                };
            case FAILED_EVENT:
                return {
                    ...state,
                    error: action.payload,
                    isLoading: false,
                    route: 'check_connection'
                };
            default:
                return state;
        }
    };