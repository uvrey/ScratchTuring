const SET_DATA = 'scratch-gui/bayes-data/setData'; // Define a type for setting data

const initialState = {
  data: null // Initialize data as null
};

const reducer = function (state, action) {
  if (typeof state === 'undefined') state = initialState;
  switch (action.type) {
    case SET_DATA:
      return Object.assign({}, state, {
        data: action.data, // Update the data with the new JSON
      });
    default:
      return state;
  }
};


const setBayesData = function (data) {
  console.log("the reducer is updating its state... (bayes data): " + data)
  return {
    type: SET_DATA,
    data: data // Include the data in the action
  };
};

export {
  reducer as default,
  initialState as bayesDataInitialState,
  setBayesData
};
