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
import arrowIcon from './arrow.svg'
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
  const hsv = { h: hue, s: 80, v: 80 }
  return Color.rgbToHex(Color.hsvToRgb(hsv))
}

const hexToHue = (hex) => {
  const hsv = Color.rgbToHsv(Color.hexToRgb(hex))
  return hueToHex(hsv.h)
}

const formatId = (modelName, label) => {
  return modelName + "_" + label
}

const getGaussianPanel = (props) => {
  const plot = props.data.plot
  return (
    <Box className={styles.dataRow}>
      {getParameterLabels(props)}
      <Box className={styles.dataCol}>
        <img src={FontDist} className={styles.visHeading} />
        <LineChart width={900} height={600} data={plot.gaussian}>
          <XAxis
            allowDecimals={false}
            dataKey="input"
            type="number"
            tick={CustomLabel}
          />
          <YAxis allowDecimals={true} />
          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
          {props.docTags}
          {plot.activeDistributions.map((key) => (
            <Line
              key={plot.styles[key].chartName}
              dataKey={key}
              type="monotone"
              stroke={plot.styles[key].stroke}
              dot={plot.styles[key].dots}
              isAnimationActive={true}
              strokeWidth={plot.styles[key].strokeWidth}
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
        <Scatter name="Sample Space" data={plot.sampleSpace} fill="#FF5959" />
      </ScatterChart>
      <Box>
      </Box>
    </Box>
  )
}

const getParameterLabels = (props) => {
  const active = props.activeModel
  switch (props.data.distribution) {
    case 'gaussian':
      return (
        <div>
          <Box className={styles.paramBox}>
            <h3>Ground Truth</h3>
            <Box className={styles.sliderBox}>
              <h4><b>mean (μ)</b></h4>
              <input
                type="range"
                id={formatId(active, "customParams_mu")}
                min="0"
                max="100"
                step="0.05"
                defaultValue={props.getValue(formatId(active, "customParams_mu"), 0.1119)}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  document.getElementById(formatId(active, "customParamsValue_mu")).value = newValue;
                }}
              />
              <input
                type="text"
                id={formatId(active, "customParamsValue_mu")}
                maxLength="4" // Restrict to 8 characters
                defaultValue={props.getValue(formatId(active, "customParams_mu"), 14.25)} // Set initial value
                className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.zoomPitch)}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  if (!isNaN(newValue) && newValue >= 0 && newValue <= 22) {
                    document.getElementById(formatId(active, "customParams_mu")).value = newValue;
                  }
                }}
              />
            </Box>
            <Box className={styles.sliderBox}>
              <h4><b>stdv (σ)</b></h4>
              <input
                type="range"
                id={formatId(active, "customParams_stdv")}
                min="0"
                max="100"
                step="0.05"
                defaultValue={props.getValue(formatId(active, "customParams_stdv"), 0.1119)}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  document.getElementById(formatId(active, "customParamsValue_stdv")).value = newValue;
                }}
              />
              <input
                type="text"
                id={formatId(active, "customParamsValue_stdv")}
                maxLength="4" // Restrict to 8 characters
                defaultValue={props.getValue(formatId(active, "customParams_stdv"), 14.25)} // Set initial value
                className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.zoomPitch)}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  if (!isNaN(newValue) && newValue >= 0 && newValue <= 22) {
                    document.getElementById(formatId(active, "customParams_stdv")).value = newValue;
                  }
                }}
              />
            </Box>

            <Box className={styles.buttonRow}>
              <button
                className={styles.mapOptionsButton}
                onClick={() => props.updateChart(active, props.vm, props.updateCustom, 'custom')}
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
                id={formatId(active, "priorParams_mu")}
                min="0"
                max="100"
                step="0.05"
                defaultValue={props.getValue(formatId(active, "priorParams_mu"), 0.1119)}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  document.getElementById(formatId(active, "priorParamsValue_mu")).value = newValue;
                }}
              />
              <input
                type="text"
                id={formatId(active, "priorParamsValue_mu")}
                maxLength="4" // Restrict to 8 characters
                defaultValue={props.getValue(formatId(active, "priorParams_mu"), 14.25)} // Set initial value
                className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.zoomPitch)}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  if (!isNaN(newValue) && newValue >= 0 && newValue <= 22) {
                    document.getElementById(formatId(active, "priorParams_mu")).value = newValue;
                  }
                }}
              />
            </Box>
            <Box className={styles.sliderBox}>
              <h4><b>stdv (σ)</b></h4>
              <input
                type="range"
                id={formatId(active, "priorParams_stdv")}
                min="0"
                max="100"
                step="0.05"
                defaultValue={props.getValue(formatId(active, "priorParams_stdv"), 0.1119)}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  document.getElementById(formatId(active, "priorParamsValue_stdv")).value = newValue;
                }}
              />
              <input
                type="text"
                id={formatId(active, "priorParamsValue_stdv")}
                maxLength="4" // Restrict to 8 characters
                defaultValue={props.getValue(formatId(active, "priorParams_stdv"), 14.25)} // Set initial value
                className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.zoomPitch)}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  if (!isNaN(newValue) && newValue >= 0 && newValue <= 22) {
                    document.getElementById(formatId(active, "priorParams_stdv")).value = newValue;
                  }
                }}
              />
            </Box>
            <Box className={styles.buttonRow}>
              <button
                className={styles.mapOptionsButton}
                onClick={() => props.updateChart(active, props.vm, props.updatePrior, 'prior')}
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

const colorRanges = {
  'yellow': [45, 75],
  "yellow-orange": [75, 90],
  "yellow-green": [90, 120],
  'green': [120, 180],
  "blue-green": [180, 210],
  'blue': [210, 270],
  "blue-violet": [270, 300],
  'violet': [300, 330],
  "red-violet": [330, 345],
  'red': [345, 15],
  "red-orange": [15, 45],
  'orange': [45, 75],
};

function getColorRange(hue) {
  // Handle wrap around the color wheel
  hue = (hue + 360) % 360;
  for (const color in colorRanges) {
    const range = colorRanges[color];
    const lower = range[0];
    const upper = range[1];
    // Check if hue is within range, accounting for wrap around
    if (lower <= upper) {
      if (lower <= hue && hue <= upper) {
        return color;
      }
    } else {
      if (hue <= upper || lower <= hue) {
        return color;
      }
    }
  }
  return null; // Use null instead of None in JavaScript
}

const HueTooltip = ({ props }) => { // TTODO in progress. 
  return (
    <Tooltip />
  )
}

const Spinner = ({ data, key }) => {
  return (
    <>
      <PieChart width={500} height={500}>
        <Pie
          data={data}
          dataKey={key}
          outerRadius={200}
          fill={data.fill} 
        />
        <Tooltip />
      </PieChart>
      <button id="spin-btn" className={styles.activeButton} onClick={() => randomRotate(".recharts-pie")}>Spin</button>
    </>
  );
};

const getHuePanel = (props) => {
  const plot = props.data.plot
  return (
    <Box className={styles.dataRow}>
      <Box className={styles.dataCol}>
        <h1>Proportion of Hues</h1>
        <Spinner data={plot.pie} key="freq" />
      </Box>
      <Box className={styles.dataCol}>
        <h1>Hue Distribution</h1>
        <BarChart width={800} height={400} data={plot.histogram}>
          <Bar type="monotone" dataKey="value" stroke={plot.histogram.stroke} dot={false} />
          <XAxis label="Hue" tick={<CustomHue />} />
          <YAxis dots={false} yAxis={-5} />
        </BarChart>
        < Tooltip />
      </Box>
    </Box>
  );
};

const getRhythmPanel = (props) => {
  const plot = props.data.plot
  return (
    <Box className={styles.dataRow}>
      <Box className={styles.dataCol}>
        <h1>Proportion of Hues</h1>
        <Spinner data={plot.pie} key="proportion" />
      </Box>

      <Box className={styles.dataCol}>
        <h1> Rhythm Samples</h1>
        <ScatterChart
          width={400}
          height={300}
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}>
          <CartesianGrid />
          <XAxis type="number" dataKey="x" name="timestamp" unit="" />
          <YAxis type="number" dataKey="y" name="value" unit="" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="Samples over Time" data={plot.timeline} fill={plot.timeline.fill} />
        </ScatterChart>
      </Box>
      <Spinner data={plot.pie} key="proportion" />
      <BarChart width={800} height={300} data={plot.timeline}>
        <Bar type="monotone" dataKey="value" stroke={"#d41444"} strokeWeight="3px" dot={false} />
        <XAxis label="Timeline" />
        <YAxis dots={false} yAxis={-5} />
      </BarChart>
      {/* <RhythmTimeline /> */}
    </Box>
  );
};

const getPanel = (props) => {
  {console.log("Deciding which panel to choose:")}
  {console.log(props.data)}
  {console.log(props.data.distribution)}
  switch (props.data.distribution) {
    case 'gaussian':
      return getGaussianPanel(props)
    case 'hue':
      return getHuePanel(props)
    case 'rhythm':
      return getRhythmPanel(props)
  }
}

const getKeyStats = (props) => {
  const data = props.data
  const samples = props.data.samples
  return (
    <Box className={styles.dataRow}>
      <Box className={styles.keyStats}>
        <div>
          <img src={FontType} className={styles.statsHeading} />
          <div><p className={styles.stat}>{data.modelName}</p></div>
        </div>
        <div>
          <img src={FontCurrentSample} className={styles.statsHeading} />
          {samples.length === 0 ? (
            <p className={styles.stat}>none</p>
          ) : (
            data.distribution === "hue" ? (
              <>
                <p
                  style={{
                    backgroundColor: samples[samples.length - 1],
                    color: samples[samples.length - 1],
                  }}
                  className={styles.stat}
                >X
                </p>
                <b>Converted to a hue: </b>
                <p
                  style={{
                    backgroundColor: hexToHue(samples[samples.length - 1]),
                    color: hexToHue(samples[samples.length - 1]),
                  }}
                  className={styles.stat}
                >X</p>
              </>
            ) : (
              <p className={styles.stat}>
                {samples[samples.length - 1]}{data.unit}
              </p>
            )
          )}
        </div>
        <div>
          <img src={FontNumSamples} className={styles.statsHeading} />
          <p className={styles.stat}>{samples.length}</p>
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
            key={modelName}
            className={modelName === props.activeModel ? styles.activeButton : styles.panelButton}
            onClick={() => props.activateModelDashboard(modelName, index)}>
            {modelName}
          </button>
        ))}
      </Box>
      <h1>Dashboard</h1>
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