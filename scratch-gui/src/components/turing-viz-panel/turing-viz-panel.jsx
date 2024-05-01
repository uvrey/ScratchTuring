import PropTypes from 'prop-types';
import React from 'react';
import Box from '../box/box.jsx';
import classNames from 'classnames';
import VM from 'scratch-vm';
import styles from './turing-viz-panel.css';
import { FormattedMessage } from 'react-intl';
import { LineChart, BarChart, Cell, Line, Bar, XAxis, YAxis, PieChart, Pie, CartesianGrid, ReferenceLine, ReferenceDot, ComposedChart, Tooltip, ScatterChart, Scatter, Legend, ResponsiveContainer } from 'recharts';
import Gaussian from '../gaussian/gaussian.jsx'
import FontCST from './font--cst.svg'
import FontDashboard from './font--dashboard.svg'
import FontScratchTuring from './font--scratchturing.svg'
import FontBarChart from './font--barChart.svg'
import FontDist from './font--normalDist.svg'
import FontCurrentSample from './font--currentSample.svg'
import FontNumSamples from './font--samples.svg'
import FontType from './font--value.svg'
import Color from './color.js'

/** CREDIT THIS CODE **/
import gsap from "gsap";


const randomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

let pos = 0;
export const randomRotate = selector => {
  let x = randomNumber(720, 1440); //between 2-4 wheel turns
  pos = pos + x;
  gsap.to(selector, {
    duration: 3,
    rotation: pos,
    transformOrigin: "50% 50%",
    ease: " power4. out"
  });
};

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

const hexToHue = (hex) => {
  const hsv = Color.rgbToHsv(Color.hexToRgb(hex))
  return hueToHex({ h: hsv.h, s: 100, v: 100 })
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


const MyPieChart = ({ data }) => {
  return (
    <PieChart width={500} height={500}>
      <Pie
        data={data}
        dataKey="freq"
        outerRadius={200}
        fill={data.fill} // Apply custom fill function
      />
      {/* <Legend /> */}
    </PieChart>
  );
};

const getHuePanel = (props) => {
  return (
    <Box className={styles.dataRow}>
      <button id="spin-btn" onClick={() => randomRotate(".recharts-pie")}>Spin</button>
      <MyPieChart data={props.data.huePieData} />
      <BarChart width={800} height={400} data={props.data.huePlotData}>
        <Bar type="monotone" dataKey="value" stroke={props.data.huePlotData.stroke} dot={false} />
        <XAxis label="Hue" tick={<CustomHue />} />
        <YAxis dots={false} yAxis={-5} />
      </BarChart>
    </Box>
  );
};

const getRhythmPanel = (props) => {
  return (
    <Box className={styles.dataRow}>
      <h1> RHYTHM STUFF</h1>
      {/* <button id="spin-btn" onClick={() => randomRotate(".recharts-pie")}>Spin</button> */}
      {/* <MyPieChart data={props.data.rhythmPieData} />
      <BarChart width={800} height={300} data={props.data.rhythmPlotData}>
        <Bar type="monotone" dataKey="value" stroke={"#d41444"} strokeWeight="3px" dot={false} />
        <XAxis label="Hue" tick={<CustomHue />} />
        <YAxis dots={false} yAxis={-5} />
      </BarChart> */}
      {/* <RhythmTimeline /> */}
    </Box>
  );
};



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
