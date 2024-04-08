const SET_RUNNING_STATE = 'scratch-gui/vm-status/SET_RUNNING_STATE';
const SET_TURBO_STATE = 'scratch-gui/vm-status/SET_TURBO_STATE';
const SET_STARTED_STATE = 'scratch-gui/vm-status/SET_STARTED_STATE';
const SET_BAYES_STATE = 'scratch-gui/vm-status/SET_BAYES_STATE';

const initialState = {
    running: false,
    started: false,
    turbo: false,
    bayes: false
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_STARTED_STATE:
        return Object.assign({}, state, {
            started: action.started
        });
    case SET_RUNNING_STATE:
        return Object.assign({}, state, {
            running: action.running
        });
    case SET_TURBO_STATE:
        return Object.assign({}, state, {
            turbo: action.turbo
        });
    case SET_BAYES_STATE:
        return Object.assign({}, state, {
            turbo: action.bayes
        });
    default:
        return state;
    }
};

const setStartedState = function (started) {
    console.log("setting started state to true")
    return {
        type: SET_STARTED_STATE,
        started: started
    };
};


const setRunningState = function (running) {
    console.log("setting running state to true")
    return {
        type: SET_RUNNING_STATE,
        running: running
    };
};

const setTurboState = function (turbo) {
    return {
        type: SET_TURBO_STATE,
        turbo: turbo
    };
};

const setBayesState = function (bayes) {
    console.log("setting bayes state to true")
    return {
        type: SET_BAYES_STATE,
        bayes: bayes
    };
};


export {
    reducer as default,
    initialState as vmStatusInitialState,
    setRunningState,
    setStartedState,
    setTurboState,
    setBayesState
};
