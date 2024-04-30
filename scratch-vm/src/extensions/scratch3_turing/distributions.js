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

const betaPDF = (x, a, b) => {
  // Beta probability density function impementation
  // using logarithms, no factorials involved.
  // Overcomes the problem with large integers
  return Math.exp(lnBetaPDF(x, a, b))
}

const lnBetaPDF = (x, a, b) => {
  // Log of the Beta Probability Density Function
  return ((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x)) - lnBetaFunc(a, b)
}

const lnBetaFunc = (a, b) => {
  // Log Beta Function
  // ln(Beta(x,y))
  foo = 0.0;

  for (i = 0; i < a - 2; i++) {
    foo += Math.log(a - 1 - i);
  }
  for (i = 0; i < b - 2; i++) {
    foo += Math.log(b - 1 - i);
  }
  for (i = 0; i < a + b - 2; i++) {
    foo -= Math.log(a + b - 1 - i);
  }
  return foo
}

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

export { generateProbabilityData };
