import PropTypes from 'prop-types';
import React from 'react';
import Box from '../box/box.jsx';
import classNames from 'classnames';
import VM from 'scratch-vm';
import styles from './turing-viz-panel.css';
import { FormattedMessage } from 'react-intl';
import { LineChart, BarChart, Cell, Line, Bar, XAxis, YAxis, PieChart, Pie, CartesianGrid, ReferenceLine, ReferenceDot, ComposedChart, Tooltip, ZAxis, ScatterChart, Scatter, Legend, ResponsiveContainer } from 'recharts';
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
import { style } from 'scratch-storage';


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

const GaussianTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) { // Check if tooltip is active and has data
    return (
      <div className={styles.gaussianTooltip}>
        <p>
          {`Odds of ${label.toFixed(2)} are `}
          <b style={{ color: "#9966FF" }} className={styles.odds}>{`${(100 * payload[0].value).toFixed(3)}%`}</b>
        </p>
      </div>
    );
  }
  return null;
}

const GaussianLegend = ({ payload, plot }) => (
  <div style={{ justifyContent: "center" }}>
    <h4 style={{ marginBottom: "3px", fontSize: "0.8rem" }}>KEY</h4>
    {/* {console.log("GAUSSIAN LEGEND PAYLOAD?")}
    {console.log(payload)} */}
    {payload.map((item) => (
      item.dataKey.includes("ps") ? (null) : (<b style={{ color: plot.styles[item.dataKey].stroke, marginRight: "1.5em" }}>{plot.styles[item.dataKey].chartName}</b>)
    ))}
  </div>
);

const getGaussianPanel = (props) => {
  const plot = props.data.plot
  return (
    <Box className={styles.dataRow}>
      {getParameterLabels(props)}
      <Box className={styles.dataCol}>
        {/* <img src={FontDist} className={styles.visHeading} /> */}
        <Box className={styles.chartBox}>
          <h3>Distributions</h3>
          <ResponsiveContainer width={'90%'} aspect={1.5}>
            <LineChart width={900} height={600} data={plot.gaussian}>
              <XAxis
                allowDecimals={false}
                dataKey="input"
                type="number"
              // tick={CustomLabel}
              />
              <YAxis allowDecimals={true} />
              <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
              {props.docTags}
              {console.log("Getting plot styles from data:")}
              {console.log(plot.activeDistributions)}
              {plot.activeDistributions.map((key) => (
                <Line
                  key={key.includes("ps") ? plot.styles['ps-options'].chartName : plot.styles[key].chartName}
                  dataKey={key}
                  type="monotone"
                  stroke={key.includes("ps") ? plot.styles['ps-options'].stroke : plot.styles[key].stroke}
                  dot={key.includes("ps") ? plot.styles['ps-options'].dots : plot.styles[key].dots}
                  isAnimationActive={true}
                  strokeWidth={key.includes("ps") ? plot.styles['ps-options'].strokeWidth : plot.styles[key].strokeWidth}
                  // Apply strokeDasharray conditionally based on the key
                  strokeDasharray={key.includes("ps") ? plot.styles['ps-options'].strokeDasharray : null}
                />
              ))}
              <ReferenceLine x={0} label={CustomLabel} />
              <Legend content={<GaussianLegend plot={plot} />} />
              <Tooltip content={<GaussianTooltip />} />
            </LineChart>
          </ResponsiveContainer>
        </Box>

      </Box>
      {/* <ScatterChart
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
      </ScatterChart> */}
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
        <div className={styles.params}>
          <Box className={styles.paramBox}>
            <h4>True Distribution</h4>
            <Box className={styles.sbuttonRow}>
              mean
              <input
                type="text"
                id={formatId(active, "customParamsValue_mu")}
                maxLength="4" // Restrict to 8 characters
                defaultValue={0} // Set initial value
                className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.zoomPitch)}
                style={{ color: "#45BDE5" }}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  if (!isNaN(newValue) && newValue >= 0 && newValue <= 22) {
                    document.getElementById(formatId(active, "customParams_mu")).value = newValue;
                  }
                }}
              />
            </Box>
            <Box className={styles.sbuttonRow}>
              stdv
              <input
                type="text"
                id={formatId(active, "customParamsValue_stdv")}
                style={{ color: "#45BDE5" }}
                maxLength="4" // Restrict to 8 characters
                defaultValue={1} // Set initial value
                className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.zoomPitch)}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  if (!isNaN(newValue) && newValue >= 0 && newValue <= 22) {
                    document.getElementById(formatId(active, "customParams_stdv")).value = newValue;
                  }
                }}
              />
            </Box>

            <Box className={styles.gaussianButtonRow}>
              <button
                className={styles.gaussianButton}
                style={{ backgroundColor: "#45BDE5" }}
                onClick={() => props.updateChart(active, props.vm, props.updateCustom, 'custom')}
              >
                <h4>Update</h4>
                <img
                  className={styles.buttonIconRight}
                // src={surpriseIcon}
                />
              </button>
            </Box>
          </Box>

          <Box className={styles.paramBox}>
            <h4>Expected Distribution</h4>
            <Box className={styles.sbuttonRow}>
              mean
              <input
                type="text"
                id={formatId(active, "priorParamsValue_mu")}
                defaultValue={0}
                style={{ color: "#FFAB1A" }}
                maxLength="4" // Restrict to 8 characters
                className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.zoomPitch)}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  if (!isNaN(newValue) && newValue >= 0 && newValue <= 22) {
                    document.getElementById(formatId(active, "priorParams_mu")).value = newValue;
                  }
                }}
              />
            </Box>
            <Box className={styles.sbuttonRow}>
              stdv
              <input
                type="text"
                id={formatId(active, "priorParamsValue_stdv")}
                style={{ color: "#FFAB1A" }}
                defaultValue={1}
                maxLength="4" // Restrict to 8 characters
                className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.zoomPitch)}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  if (!isNaN(newValue) && newValue >= 0 && newValue <= 22) {
                    document.getElementById(formatId(active, "priorParams_stdv")).value = newValue;
                  }
                }}
              />
            </Box>
            <Box className={styles.gaussianButtonRow}>
              <button
                className={styles.gaussianButton}
                style={{ backgroundColor: "#FFAB1A" }}
                onClick={() => props.updateChart(active, props.vm, props.updatePrior, 'prior')}
              >
                <h4>Update</h4>
                {/* <FormattedMessage
                  defaultMessage="Update Belief"
                  description="Button in prompt for starting a search"
                  id="gui.vizPanel.updateBelief"
                /> */}
                <img
                  className={styles.buttonIconRight}
                // src={compassIcon}
                />
              </button>
            </Box>
          </Box>
        </div>
      ); // Use PascalCase for model names
    // case 'color':
    //   return (<div>Hue: <h1>λ</h1></div>)
    // case 'rhythm':
    //   return (<div>Rhythm: <h1>n</h1><h1>p</h1></div>)
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

const Spinner = ({ data }) => {
  return (
    <>
      <PieChart width={500} height={500}>
        <Pie
          data={data}
          dataKey={"value"}
          outerRadius={200}
          fill={data.fill}
        />
        <Tooltip />
      </PieChart>
      <button id="spin-btn" className={styles.activeButton} onClick={() => randomRotate(".recharts-pie")}>Spin</button>
    </>
  );
};

const HueTooltip = ({ active, payload, label, props }) => {
  console.log("PROPS?")
  console.log(props)
  if (active && payload && payload.length) { // Check if tooltip is active and has data
    return (
      <div>
        {/* <p>{`${label}: ${payload[0].value}`}</p> */}
        <div className={styles.hueBox}>
          {props.data.plot.hues.hueFamilies[Number(label)].map((hex, index) => (
            <div className={styles.hueSwatch} style={{ backgroundColor: hex }} />
          ))}
        </div>
        <p>{`Hue: ${label}`}</p>
      </div>
    );
  }
  return null;
};
const getHuePanel = (props) => {
  const plot = props.data.plot
  return (
    <Box className={styles.dataRow}>
      <Box className={styles.dataCol}>
        <h4>Proportion of Hues</h4>
        <Spinner data={plot.pie} key="freq" />
      </Box>
      <Box className={styles.dataCol}>
        <h4>Hue Distribution</h4>
        <ResponsiveContainer width={"100%"} aspect={1}>
          <BarChart width={800} height={400} data={plot.histogram}>
            <Bar type="monotone" dataKey="value" stroke={plot.histogram.stroke} dot={false} />
            <XAxis label="Hue" tick={<CustomHue />} />
            <YAxis dots={false} yAxis={-5} />
            < Tooltip content={<HueTooltip props={props} />} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

const getRhythmPanel = (props) => {
  const plot = props.data.plot
  return (
    <Box className={styles.dataRow}>
      <Box className={styles.dataCol}>
        <h4>Proportion of Rhythms</h4>
        <Spinner data={plot.pie} key="proportion" />
      </Box>

      <Box className={styles.dataCol}>
        <h4> Rhythm Samples</h4>
        {/* <ScatterChart
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
        </ScatterChart> */}


        {/* <ScatterChart
          margin={{
            top: 10,
            right: 0,
            bottom: 0,
            left: 0,
          }}
        >
          <XAxis
            type="category"
            dataKey="value"
            interval={0}
            tick={{ fontSize: 0 }}
            tickLine={{ transform: 'translate(0, -6)' }}
          />
          <YAxis
            type="number"
            dataKey="index"
            name="RT"
            height={10}
            width={80}
            tick={false}
            tickLine={false}
            axisLine={false}
            label={{ value: 'RHYTHMTYPE', position: 'insideRight' }}
          />
          <ZAxis type="number" dataKey="value" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} wrapperStyle={{ zIndex: 100 }} />
          <Scatter data={plot.timeline} fill="#8884d8" />
        </ScatterChart> */}

      </Box>
      {/* <BarChart width={800} height={300} data={plot.timeline}>
        <Bar type="monotone" dataKey="value" stroke={"#d41444"} strokeWeight="3px" dot={false} />
        <XAxis label="Timeline" />
        <YAxis dots={false} yAxis={-5} />
      </BarChart> */}
      {/* <RhythmTimeline /> */}
    </Box>
  );
};

const getPanel = (props) => {
  { console.log("Deciding which panel to choose:") }
  { console.log(props.data) }
  { console.log(props.data.distribution) }
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
    // <Box className={styles.dataRow}>
    <Box className={styles.keyStats}>
      <div>
        <h4>Model</h4>
        {/* <img src={FontType} className={styles.statsHeading} /> */}
        <div><p className={styles.stat}>{data.modelName}</p></div>
      </div>
      <div>
        <h4>Current Observation</h4>
        {/* <img src={FontCurrentSample} className={styles.statsHeading} /> */}
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
        <h4>How many observations?</h4>
        <p className={styles.stat}>{samples.length}</p>
      </div>
    </Box>
    // </Box>
  );
}
const TuringVizPanel = props => (
  <Box className={styles.body}>
    <Box className={styles.buttonRow}>
      {props.activeModels.map((modelName, index) => (
        <button
          key={modelName}
          className={modelName === props.activeModel ? styles.activeButton : styles.panelButton}
          onClick={() => props.activateModelDashboard(modelName, index)}>
          <h4>{modelName}</h4>
        </button>
      ))}
    </Box>
    <Box className={styles.vizPanel}>
      <Box className={styles.dataCol}>
        {getPanel(props)}
        {getKeyStats(props)}
      </Box>
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