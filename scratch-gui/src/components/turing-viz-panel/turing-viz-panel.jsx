import PropTypes from 'prop-types';
import React from 'react';
import Box from '../box/box.jsx';
import classNames from 'classnames';
import VM from 'scratch-vm';
import styles from './turing-viz-panel.css';
import { FormattedMessage } from 'react-intl';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, PieChart, Pie, CartesianGrid, ReferenceLine, ReferenceDot, ComposedChart, Tooltip, ScatterChart, Scatter, Legend, ResponsiveContainer } from 'recharts';
import Gaussian from '../gaussian/gaussian.jsx'
import FontCST from './font--cst.svg'
import FontDashboard from './font--dashboard.svg'
import FontScratchTuring from './font--scratchturing.svg'
import FontBarChart from './font--barChart.svg'
import FontDist from './font--normalDist.svg'
import FontCurrentSample from './font--currentSample.svg'
import FontNumSamples from './font--samples.svg'
import FontType from './font--value.svg'
import Carousel from './carousel.jsx'
import Color from './color.js'

import { Chart } from 'react-chartjs-2'
import { HuePanel } from './turing-hue-panel.jsx';
import { ProportionPanel } from './turing-proportion-chart.jsx'

// import { Doughnut } from 'react-chartjs-2';
// import MeanPlot from '../mean-plot/mean-p[].jsx'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.customTooltip}>
        <p className={styles.chartLabel}>{`Average: ${payload[0].value} sec`}</p>
        <p className="intro"></p>
      </div>
    );
  }
  return null;
};

const CustomLabel = (props) => { // TODO modify this so it returns rectangles with a particular colour
  return (
    <foreignObject className={styles.labelWrapper} x="0" y="0">
      <div className={styles.customLabel}>
        Label
      </div>
    </foreignObject>
  );
};

const CustomHue = (props) => { // TODO modify this so it returns rectangles with a particular colour
  // console.log(props.payload)
  const hue = props.payload.value % 360
  return (
    <foreignObject className={styles.labelWrapper} y={260} x={props.payload.tickCoord}>
      <div className={styles.colorSwatch} style={{ backgroundColor: hueToHex(hue) }} />
    </foreignObject>
  );
};

/**
 * Convert a hex color (e.g., F00, #03F, #0033FF) to an RGB color object.
 * CC-BY-SA Tim Down:
 * https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
 * @param {!string} hex Hex representation of the color.
 * @return {RGBObject} null on failure, or rgb: {r: red [0,255], g: green [0,255], b: blue [0,255]}.
 */

const hueToHex = (hue) => {
  const hsv = { h: hue, s: 100, v: 100 }
  return Color.rgbToHex(Color.hsvToRgb(hsv))
}

const formatId = (modelName, label) => {
  return modelName + "_" + label
}

const getGaussianPanel = (props) => {
  return (
    <Box className={styles.dataRow}>
      {getParameterLabels(props)}
      <Box className={styles.dataCol}>
        <img src={FontDist} className={styles.visHeading} />
        <LineChart width={900} height={600} data={props.data.distData}>
          <XAxis
            allowDecimals={false}
            dataKey="input"
            type="number"
            tick={CustomLabel}
          />
          <YAxis allowDecimals={true} />
          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
          {props.docTags}
          {props.data.activeDists.map((key) => (
            <Line
              key={props.data.styles[key].chartName}
              dataKey={key}
              type="monotone"
              stroke={props.data.styles[key].stroke}
              dot={props.data.styles[key].dots}
              isAnimationActive={true}
              strokeWidth={props.data.styles[key].strokeWidth}
            />
          ))}
          <ReferenceLine x={0} label={CustomLabel} />
          <Legend />
          <Tooltip />
        </LineChart>
      </Box>
      <ScatterChart
        width={400}
        height={300}
        margin={{
          top: 20,
          right: 20,
          bottom: 20,
          left: 20,
        }}
      >
        <CartesianGrid />
        <XAxis type="number" dataKey="x" name="sample" unit="" />
        <YAxis type="number" dataKey="y" name="value" unit="" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter name="Sample Space" data={props.data.sampleSpace} fill="#FF5959" />
      </ScatterChart>
      <Box>
      </Box>
    </Box>
  )
}


const getParameterLabels = (props) => {
  switch (props.data.user_model.distribution) {
    case 'gaussian':
      return (
        <div>
          {/* <label htmlFor="groundTruth"> //TTODO
            <p>Show Custom Distribution</p>
            <input type="checkbox" onClick={props.toggleVisibility(props.vm, {modelName: props.activeModel, mode: 'custom'})} id="groundTruth" name="groundTruth" value="yes" />
          </label> */}
          <Box className={styles.paramBox}>
            <h3>Ground Truth</h3>
            <Box className={styles.sliderBox}>
              <h4><b>mean (μ)</b></h4>
              <input
                type="range"
                id={formatId(props.activeModel, "customParams_mu")}
                min="0"
                max="100"
                step="0.05"
                defaultValue={props.getValue(formatId(props.activeModel, "customParams_mu"), 0.1119)}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  document.getElementById(formatId(props.activeModel, "customParamsValue_mu")).value = newValue;
                }}
              />
              <input
                type="text"
                id={formatId(props.activeModel, "customParamsValue_mu")}
                maxLength="4" // Restrict to 8 characters
                defaultValue={props.getValue(formatId(props.activeModel, "customParams_mu"), 14.25)} // Set initial value
                className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.zoomPitch)}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  if (!isNaN(newValue) && newValue >= 0 && newValue <= 22) {
                    document.getElementById(formatId(props.activeModel, "customParams_mu")).value = newValue;
                  }
                }}
              />
            </Box>
            <Box className={styles.sliderBox}>
              <h4><b>stdv (σ)</b></h4>
              <input
                type="range"
                id={formatId(props.activeModel, "customParams_stdv")}
                min="0"
                max="100"
                step="0.05"
                defaultValue={props.getValue(formatId(props.activeModel, "customParams_stdv"), 0.1119)}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  document.getElementById(formatId(props.activeModel, "customParamsValue_stdv")).value = newValue;
                }}
              />
              <input
                type="text"
                id={formatId(props.activeModel, "customParamsValue_stdv")}
                maxLength="4" // Restrict to 8 characters
                defaultValue={props.getValue(formatId(props.activeModel, "customParams_stdv"), 14.25)} // Set initial value
                className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.zoomPitch)}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  if (!isNaN(newValue) && newValue >= 0 && newValue <= 22) {
                    document.getElementById(formatId(props.activeModel, "customParams_stdv")).value = newValue;
                  }
                }}
              />
            </Box>

            <Box className={styles.buttonRow}>
              <button
                className={styles.mapOptionsButton}
                onClick={() => props.updateChart(props.activeModel, props.vm, props.updateCustom, 'custom')}
              >
                <FormattedMessage
                  defaultMessage="Update Ground Truth"
                  description="Button in prompt for starting a search"
                  id="gui.mapModal.groundTruth"
                />
                <img
                  className={styles.buttonIconRight}
                // src={surpriseIcon}
                />
              </button>
            </Box>
          </Box>

          <Box className={styles.paramBox}>
            <h3>Prior</h3>
            <Box className={styles.sliderBox}>

              <h4><b>mean (μ)</b></h4>
              <input
                type="range"
                id={formatId(props.activeModel, "priorParams_mu")}
                min="0"
                max="100"
                step="0.05"
                defaultValue={props.getValue(formatId(props.activeModel, "priorParams_mu"), 0.1119)}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  document.getElementById(formatId(props.activeModel, "priorParamsValue_mu")).value = newValue;
                }}
              />
              <input
                type="text"
                id={formatId(props.activeModel, "priorParamsValue_mu")}
                maxLength="4" // Restrict to 8 characters
                defaultValue={props.getValue(formatId(props.activeModel, "priorParams_mu"), 14.25)} // Set initial value
                className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.zoomPitch)}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  if (!isNaN(newValue) && newValue >= 0 && newValue <= 22) {
                    document.getElementById(formatId(props.activeModel, "priorParams_mu")).value = newValue;
                  }
                }}
              />
            </Box>
            <Box className={styles.sliderBox}>
              <h4><b>stdv (σ)</b></h4>
              <input
                type="range"
                id={formatId(props.activeModel, "priorParams_stdv")}
                min="0"
                max="100"
                step="0.05"
                defaultValue={props.getValue(formatId(props.activeModel, "priorParams_stdv"), 0.1119)}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  document.getElementById(formatId(props.activeModel, "priorParamsValue_stdv")).value = newValue;
                }}
              />
              <input
                type="text"
                id={formatId(props.activeModel, "priorParamsValue_stdv")}
                maxLength="4" // Restrict to 8 characters
                defaultValue={props.getValue(formatId(props.activeModel, "priorParams_stdv"), 14.25)} // Set initial value
                className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.zoomPitch)}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  if (!isNaN(newValue) && newValue >= 0 && newValue <= 22) {
                    document.getElementById(formatId(props.activeModel, "priorParams_stdv")).value = newValue;
                  }
                }}
              />
            </Box>
            <Box className={styles.buttonRow}>
              <button
                className={styles.mapOptionsButton}
                onClick={() => props.updateChart(props.activeModel, props.vm, props.updatePrior, 'prior')}
              >
                <FormattedMessage
                  defaultMessage="Update Belief"
                  description="Button in prompt for starting a search"
                  id="gui.vizPanel.updateBelief"
                />
                <img
                  className={styles.buttonIconRight}
                // src={compassIcon}
                />
              </button>
            </Box>
          </Box>
        </div>
      ); // Use PascalCase for model names
    case 'color':
      return (<div>Hue: <h1>λ</h1></div>)
    case 'rhythm':
      return (<div>Rhythm: <h1>n</h1><h1>p</h1></div>)
    default:
      return (<h1>Unknown distribution</h1>);
  }
};

const getHueDistributionData = () => {
  return Array(361).fill(0).map((_, i) => ({ angle: i, density: 1 / 360 }));
}

const customFill = () => {
  return "#d41444"
}

const MyPieChart = ({ data }) => {

  // Define custom fill function for pie 

  // const customFill = (data) => {
  //   const category = data.category; // Assuming 'category' property in data
  //   return getColorByCategory(category);
  // };
  return (
    <PieChart width={700} height={700}>
      <Pie
        data={data}
        dataKey="freq"
        outerRadius={250}
        fill={data.fill} // Apply custom fill function
      />
      <Legend />
    </PieChart>
  );
};


const getHuePanel = (props) => {
  const spinBtn = document.getElementById("spin-btn");
  const finalValue = document.getElementById("final-value");
  const rotationValues = [
    { minDegree: 0, maxDegree: 30, value: 2 },
    { minDegree: 31, maxDegree: 90, value: 1 },
    { minDegree: 91, maxDegree: 150, value: 6 },
    { minDegree: 151, maxDegree: 210, value: 5 },
    { minDegree: 211, maxDegree: 270, value: 4 },
    { minDegree: 271, maxDegree: 330, value: 3 },
    { minDegree: 331, maxDegree: 360, value: 2 },
  ];
  const [chartRotation, setChartRotation] = React.useState(0); // State for chart rotation

  const valueGenerator = (angleValue) => {
    for (let i of rotationValues) {
      if (angleValue >= i.minDegree && angleValue <= i.maxDegree) {
        finalValue.innerHTML = `<p>Value: ${i.value}</p>`;
        spinBtn.disabled = false;
        break;
      }
    }
  };

  const handleSpinClick = () => {
    spinBtn.disabled = true;
    finalValue.innerHTML = `<p>Good Luck!</p>`;

    let interval = setInterval(() => {
      setChartRotation((prevRotation) => (prevRotation + 5) % 360); // Update rotation with modulo for 0-360 range

      if (chartRotation >= 360) {
        clearInterval(interval); // Clear the initial spinning interval

        // Generate random stop time between 2-4 seconds
        const stopTime = Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000;

        setTimeout(() => {
          const decelerationInterval = setInterval(() => {
            setChartRotation((prevRotation) => (prevRotation - 10) % 360); // Decelerate
            if (chartRotation === 0) {
              const randomDegree = Math.floor(Math.random() * (355 - 0 + 1) + 0);
              valueGenerator(randomDegree);
              // clearInterval(decelerationInterval); // Clear deceleration interval
            }
          }, 1); // Slower interval for deceleration
        }, stopTime);
      }
    }, 10); // Initial faster interval for spinning
  };

  const stopSpinClick = () => {
    setChartRotation(0)
  }


  return (
    <Box className={styles.dataRow}>
      <div className="container">
        <PieChart width={700} height={700} style={{ transform: `rotate(${chartRotation}deg)` }} >
          <Pie
            data={props.data.huePieData}
            dataKey="freq"
            outerRadius={250}
            fill={data.fill} // Apply custom fill function (if needed)
          />
          <Legend />
        </PieChart>
        <button id="spin-btn" onClick={handleSpinClick}>Spin</button>
        <button id="spin-btn" onClick={stopSpinClick}>Stop</button>
        <img src="spinner-arrow-.svg" alt="spinner-arrow" />
      </div>
      <div id="final-value">
        <p>Click On The Spin Button To Start</p>
      </div>


      <BarChart width={800} height={300} data={props.data.huePlotData}>
        <Bar type="monotone" dataKey="value" stroke={"#d41444"} strokeWeight="3px" dot={false} />
        <XAxis label="Hue" tick={<CustomHue />} />
        <YAxis dots={false} yAxis={-5} />
      </BarChart>

    </Box>
  );
};


// const getHuePanel = (props) => {
//   const wheel = document.getElementById("wheel");
//   const spinBtn = document.getElementById("spin-btn");
//   const finalValue = document.getElementById("final-value");
//   const rotationValues = [
//     { minDegree: 0, maxDegree: 30, value: 2 },
//     { minDegree: 31, maxDegree: 90, value: 1 },
//     { minDegree: 91, maxDegree: 150, value: 6 },
//     { minDegree: 151, maxDegree: 210, value: 5 },
//     { minDegree: 211, maxDegree: 270, value: 4 },
//     { minDegree: 271, maxDegree: 330, value: 3 },
//     { minDegree: 331, maxDegree: 360, value: 2 },
//   ];
//   let myChart = (
//     <PieChart width={700} height={700}>
//       <Pie
//         data={data}
//         dataKey="freq"
//         outerRadius={250}
//         fill={data.fill} // Apply custom fill function
//       />
//       <Legend />
//     </PieChart>
//   );
//   const valueGenerator = (angleValue) => {
//     for (let i of rotationValues) {
//       if (angleValue >= i.minDegree && angleValue <= i.maxDegree) {
//         finalValue.innerHTML = `<p>Value: ${i.value}</p>`;
//         spinBtn.disabled = false;
//         break;
//       }
//     }
//   };
//   let count = 0;
//   let resultValue = 101;
//   spinBtn.addEventListener("click", () => {
//     spinBtn.disabled = true;
//     finalValue.innerHTML = `<p>Good Luck!</p>`;
//     let randomDegree = Math.floor(Math.random() * (355 - 0 + 1) + 0);
//     let rotationInterval = window.setInterval(() => {
//       myChart.options.rotation = myChart.options.rotation + resultValue;
//       myChart.update();
//       if (myChart.options.rotation >= 360) {
//         count += 1;
//         resultValue -= 5;
//         myChart.options.rotation = 0;
//       } else if (count > 15 && myChart.options.rotation == randomDegree) {
//         valueGenerator(randomDegree);
//         clearInterval(rotationInterval);
//         count = 0;
//         resultValue = 101;
//       }
//     }, 10);
//   });


//   return (
//     <Box className={styles.dataRow}>
//       <div class="container">
//         < MyPieChart data={props.data.huePieData} />
//         <button id="spin-btn">Spin</button>
//         <img src="spinner-arrow-.svg" alt="spinner-arrow" />
//       </div>
//       <div id="final-value">
//         <p>Click On The Spin Button To Start</p>
//       </div>
//     </Box>
//   );
// }

{/* < MyPieChart data={props.data.huePieData}  /> */ }

{/* <PieChart width={700} height={700}>
        <Pie data={props.data.huePieData} dataKey="freq" outerRadius={250} />
        <Legend />
      </PieChart> */}

// {console.log("WE NOW WANT TO PLOT SOMETHING :))")}
// {console.log(props.data)}


const getPanel = (props) => {
  switch (props.data.user_model.distribution) {
    case 'gaussian':
      return getGaussianPanel(props)
    case 'hue':
      return getHuePanel(props)
    case 'rhythm':
      return getRhythmPanel(props)
  }
}

const getKeyStats = (props) => {
  return (
    <Box className={styles.dataRow}>
      <Box className={styles.keyStats}>
        <div>
          <img src={FontType} className={styles.statsHeading} />
          <div><p className={styles.stat}>{props.data.user_model.modelName}</p></div>
        </div>
        <div>
          <img src={FontCurrentSample} className={styles.statsHeading} />
          {(props.data.samples.length == 0) ? (<p className={styles.stat}>none</p>) : (<p className={styles.stat}>{props.data.samples[props.data.samples.length - 1]}{props.data.user_model.unit}</p>)}
        </div>
        <div>
          <img src={FontNumSamples} className={styles.statsHeading} />
          <p className={styles.stat}>{props.data.samples.length}</p>
        </div>
      </Box>
    </Box>);
}
const TuringVizPanel = props => (
  <Box className={styles.body}>
    <Box className={styles.dataCol}>

      <Box className={styles.buttonRow}>
        {props.activeModels.map((modelName, index) => (
          <button
            key={modelName}  // Add a unique key for each button
            className={modelName === props.activeModel ? styles.activeButton : styles.panelButton}
            onClick={() => props.activateModelDashboard(modelName, index)}
          >
            {modelName}
          </button>
        ))}
      </Box>

      <img src={FontDashboard} className={styles.dashboard} />
      {console.log("INSIDE VIZ PANEL! Props are..")}
      {console.log(props)}
      {getKeyStats(props)}
      {getPanel(props)}
    </Box>
  </Box>
);

TuringVizPanel.propTypes = {
  data: PropTypes.object,
  vm: PropTypes.instanceOf(VM),
  activeModels: PropTypes.array
};

TuringVizPanel.defaultProps = {
  connectingMessage: 'Connecting'
};

export {
  TuringVizPanel as default,
};


{/* <Box className={styles.dataRow}> */ }
{/* <Gaussian 
                    name="Gaussian"
                    data={props.data.distData}
                    lines={props.data.distLines}
                >
                </Gaussian> */}

{/* <MeanPlot 
                    name="Gaussian"
                    data={props.data.distData}
                    lines={props.data.distLines}
                >
                </MeanPlot> */}
