const SET_ID = 'scratch-gui/bayes-modal/setId';

const initialState = {
    extensionId: null
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_ID:
        return Object.assign({}, state, {
            extensionId: action.extensionId
        });
    default:
        return state;
    }
};

const setBayesModalExtensionID = function (extensionId) {
    return {
        type: SET_ID,
        extensionId: extensionId
    };
};

export {
    reducer as default,
    initialState as bayesModalInitialState,
    setBayesModalExtensionID
};
