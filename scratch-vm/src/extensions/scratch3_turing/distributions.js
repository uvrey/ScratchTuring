import React from 'react';

const findMinMax = (lines) => {
  if (lines.length < 1) {
    return { min: 0, max: 0 };
  }

  let min = lines[0].mean;
  let max = lines[0].mean;

  lines.forEach(({ mean, stdv }) => {
    const localMin = mean - 4 * stdv;
    const localMax = mean + 4 * stdv;

    if (min === null || localMin < min) {
      min = localMin;
    }

    if (max === null || localMax > max) {
      max = localMax;
    }
  });

  return {
    min,
    max,
  };
};

const getInputs = (min, max, points) => {
  const inputs = [];
  const range = max - min;

  for (let i = min; i < max; i += range / points) {
    inputs.push(i);
  }

  return inputs;
};

const probFunc = (x, mean, stdv) => {
  return (
    Math.pow(Math.E, ((-1 / 2) * Math.pow(x - mean, 2)) / Math.pow(stdv, 2)) /
    (stdv * Math.pow(2 * Math.PI, 1 / 2))
  );
};

const generateProbabilityData = (lines) => {
  if (lines.length < 1) {
    return [];
  }

  const data = [];

  //obtaining an overall min and max and the input points
  const { min, max } = findMinMax(lines);
  const inputs = getInputs(min, max, 200);

  //building the data for each input
  inputs.forEach((input) => {
    const lineProbs = {};

    lines.forEach(({ id, mean, stdv }) => {
      lineProbs[id] = probFunc(input, mean, stdv);
    });

    data.push({
      input,
      ...lineProbs,
    });
  });

  return data;
};

const findMinMaxList = (data) => {
  if (data.length === 0) return { min: null, max: null }; // Handle empty array case
  return {
    min: Math.min(...data),
    max: Math.max(...data),
  };
}

// TODO generate probability data for curve plots... gaussian, poisson, binomial etc. 
const generateGaussianProbabilityData = (id, mean, stdv) => {
  const data = [];

  //obtaining an overall min and max and the input points
  const { min, max } = findMinMaxList(inputData);
  const inputs = getInputs(min, max, 200);

  //building the data for each input
  inputs.forEach((input) => {
    const lineProbs = {};

    lines.forEach(({ id, mean, stdv }) => {
      lineProbs[id] = probFunc(input, mean, stdv);
    });

    data.push({
      input,
      ...lineProbs,
    });
  });

  return data;
};


export { generateProbabilityData };
