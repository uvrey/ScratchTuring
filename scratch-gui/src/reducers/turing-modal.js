const SET_ID = 'scratch-gui/turing-modal/setId';
const SET_DATA = 'scratch-gui/turing-modal/setData'; // Define turing a type for setting data

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

const setTuringModalData = function (data) {
  console.log("the reducer is updating its state... (turing modal): " + data)
  return {
    type: SET_DATA,
    data: data // Include the data in the action
  };
};

export {
  reducer as default,
  initialState as turingModalInitialState,
  setTuringModalData
};
