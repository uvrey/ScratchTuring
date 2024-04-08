const SET_ID = 'scratch-gui/bayes-modal/setId';
const SET_DATA = 'scratch-gui/bayes-modal/setData'; // Define a type for setting data

const initialState = {
  extensionId: null,
  data: null // Initialize data as null
};

const reducer = function (state, action) {
  if (typeof state === 'undefined') state = initialState;
  switch (action.type) {
    case SET_ID:
      return Object.assign({}, state, {
        extensionId: action.extensionId,
      });
    case SET_DATA:
      return Object.assign({}, state, {
        data: action.data, // Update the data with the new JSON
      });
    default:
      return state;
  }
};

const setBayesModalExtensionID = function (extensionID) {
    return {
        type: SET_ID,
        extensionId: extensionId
    };
};

const setBayesModalData = function (data) {
  console.log("the reducer is updating its state... (bayes modal): " + data)
  return {
    type: SET_DATA,
    data: data // Include the data in the action
  };
};

export {
  reducer as default,
  initialState as bayesModalInitialState,
//   setBayesModalExtensionID,
  setBayesModalData
};
