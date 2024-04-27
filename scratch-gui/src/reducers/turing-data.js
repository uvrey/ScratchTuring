const SET_DATA = 'scratch-gui/turing-data/setData'; // Define a type for setting data
const SET_TURING_ACTIVE = 'scratch-gui/turing-data/setTuringActive'; // Define a type for setting data
const SET_DATA_STATE = 'scratch-gui/turing-data/setDataState'; // Define a type for setting data

const initialState = {
  // Build data for the Turing Control panel
  dataIsSet: {}, // TODO
  data: {},
  turingActive: false // TODO set this to false and then trigger when extension opens
};

// data: {
//     state: {}, // type of problem (ie. time taken, proportion, likelihood - affects visualisations)
//     samples: [], // updates the samples list for testing
//     barData: [], // plots bar chart data
//     distData: [], // plots normal distribution
//     distLines: [],
//     domain: [-1,1],
//     mode: '', // HUE or NUMERIC
// },

const reducer = function (state, action) {
  if (typeof state === 'undefined') state = initialState;
  switch (action.type) {
    case SET_DATA:
      return Object.assign({}, state, {
        data: action.data, // Update the data with the new JSON
      });
    case SET_DATA_STATE:
      return Object.assign({}, state, {
        dataIsSet: action.dataIsSet, // Update the data with the new JSON
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

const setTuringData = function (data) {
  console.log("the reducer is updating its state... (turing data): " + data)
  return {
    type: SET_DATA,
    data: data // Include the data in the action
  };
};

const setTuringDataState = function (state) {
  console.log("the reducer is updating the dataIsSet state... (turing data): " + state)
  console.log(state)
  return {
    type: SET_DATA_STATE,
    dataIsSet: state // Include the data in the action
  };
};

export {
  reducer as default,
  initialState as turingDataInitialState,
  setTuringData,
  setTuringActive,
  setTuringDataState
};