const SET_DATA = 'scratch-gui/bayes-data/setData'; // Define a type for setting data

const initialState = {
  data: {
      state: {}, // type of problem (ie. time taken, proportion, likelihood - affects visualisations)
      samples: [], // updates the samples list
      barData: [], // plots bar chart data
      distData: [], // plots normal distribution
      distLines: [],
      domain: [-1,1]
  } // Initialize data as null
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
