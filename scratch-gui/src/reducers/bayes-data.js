const SET_DATA = 'scratch-gui/bayes-data/setData'; // Define a type for setting data
const SET_TURING_ACTIVE = 'scratch-gui/bayes-data/setTuringActive'; // Define a type for setting data

const initialState = {
  // Build data for the Turing Control panel
  data: {
      state: {}, // type of problem (ie. time taken, proportion, likelihood - affects visualisations)
      samples: [], // updates the samples list for testing
      barData: [], // plots bar chart data
      distData: [], // plots normal distribution
      distLines: [],
      domain: [-1,1],
      spriteX: '',
      spriteY: '',
      mode: '', // TIME-based, POSITION-based, HUE-based
  },
  turingActive: false // TODO set this to false and then trigger when extension opens
};

const reducer = function (state, action) {
  if (typeof state === 'undefined') state = initialState;
  switch (action.type) {
    case SET_DATA:
      return Object.assign({}, state, {
        data: action.data, // Update the data with the new JSON
      });
    case SET_TURING_ACTIVE:
        return Object.assign({}, state, {
          turingActive: action.turingActive, // Update the data with the new JSON
        });
    default:
      return state;
  }
};

const setTuringActive = function () {
  console.log("setting turing extension active!")
  return {
    type: SET_TURING_ACTIVE,
    turingActive: true // Include the data in the action
  };
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
  setBayesData,
  setTuringActive
};
