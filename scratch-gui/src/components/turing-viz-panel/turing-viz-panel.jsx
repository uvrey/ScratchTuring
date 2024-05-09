import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Box from '../box/box.jsx';
import classNames from 'classnames';
import VM from 'scratch-vm';
import styles from './turing-viz-panel.css';
import { FormattedMessage } from 'react-intl';
import { LineChart, BarChart, Cell, Line, Label, Bar, XAxis, YAxis, PieChart, Pie, CartesianGrid, ReferenceLine, ReferenceDot, ComposedChart, Tooltip, ZAxis, ScatterChart, Scatter, Legend, ResponsiveContainer } from 'recharts';
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
import arrowLeftIcon from './arrow-left.svg'
import ZoomChart from './turing-viz-zoomChart.jsx'
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

const CustomHue = (props) => {
  var shiftFactor = 0

  const hue = (props.payload.value + shiftFactor) % 360;
  // Calculate the corresponding color in hex format
  const color = hueToHex(hue);

  console.log(props.payload)

  // Use an SVG rect instead of foreignObject
  return (
    <rect
      className={styles.hueBox}
      x={props.payload.tickCoord}
      y={props.payload.offset}
      width="1.2em"
      height="1.2em"
      fill={color} // Set fill color to calculated hex
    />
  );
};

const CustomizedLabel = (label) => {
  return (
    <div className={styles.meanLabel}>{label}</div>
  );
}


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

const getMeansComponent = (plot) => {
  { console.log("GETTTING MEAN COMPONENT...") }
  { console.log(plot) }
  return (
    <div className={styles.dataRow}>
      {Object.entries(plot.means).map(([key, index]) => (
        <p style={{ color: "#d41444" }}>{key}: {index}</p>
      ))}
    </div>
  )
}

const GaussianTooltip = ({ active, payload, label, plot }) => {

  // console.log("plot?")
  // console.log(plot)

  // console.log("helpful tooltip should show??")
  // console.log(plot.helpfulTooltip)

  if (active && payload && payload.length) { // Check if tooltip is active and has data
    // console.log("tooltip payload?")
    // console.log(payload)

    if (plot.helpfulTooltip) {
      return (
        <div className={styles.gaussianTooltip}>
          🎲 Likelihood of <b>{label.toFixed(2)}</b> 🎲
          {payload.map((key, index) => (
            <p key={payload[index]}> {/* Add unique key for each item */}
              <b
                style={{
                  color: payload[index].dataKey.includes("ps")
                    ? plot.styles["ps-options"].stroke // Access ps-options style
                    : plot.styles[payload[index].dataKey].stroke, // Access other styles based on key
                }}
                className={styles.odds}
              >
                {/* {payload[index].dataKey.includes("ps")
                  ? `Updated Belief (${index + 1})`  // Use index + 1 for human-readable numbering
                  : plot.styles[payload[index].dataKey].chartName
                }  */}
                ➡️ {
                  `${(100 * payload[index].value).toFixed(3)}%` +
                  (plot.meanLines ? ` (Mean = ${plot.means[payload[index].dataKey]})` : '')
                }
              </b>
            </p>
          ))}
        </div>
      );
    } else {
      return (
        <div className={styles.gaussianTooltip} style={{ maxWidth: "3em" }}>
          {label.toFixed(2)}
        </div>
      )
    }
  }
  return null;
}

const GaussianLegend = ({ payload, plot, props }) => (
  <div style={{ justifyContent: "center" }}>
    <h4 style={{ marginBottom: "1em", fontSize: "0.8rem" }}>KEY 🗝️</h4>
    {/* {console.log("GAUSSIAN LEGEND PAYLOAD?")}
    {console.log(payload)} */}
    {payload.map((item) => (
      item.dataKey.includes("ps") ? (null) : (
        <b key={item.dataKey} style={{ color: plot.styles[item.dataKey].stroke, marginRight: "1.5em" }}>{plot.styles[item.dataKey].chartName}</b>)
    ))}

    {/* {console.log("Inside legend! ")}
    {console.log(props)} */}
    {props.data.samples.length > 0 ? (<b style={{ color: plot.styles["ps-options"].stroke, marginRight: "1.5em" }}>Updated Belief</b>) : (null)}

    <div style={{ marginTop: "0.5em" }}>
      <label htmlFor="checkpoint-input-tooltip" className={styles.checkboxLabel}>
        <input
          id="checkpoint-tooltip"
          type="checkbox"
          className={styles.chartCheckbox}
          onChange={() => props.updateChart(props.activeModel, 'tooltip')}
        // Add a default checked state if needed (optional)
        />
        Helpful tooltip
      </label>
      <label htmlFor="checkpoint-input-means" className={styles.checkboxLabel}>
        <input
          id="checkpoint-meanLines"
          className={styles.chartCheckbox}
          type="checkbox"
          onChange={() => props.updateChart(props.activeModel, 'meanLines')}
        // Add a default checked state if needed (optional)
        />
        Mean Lines
      </label>
    </div>

  </div>
);

const renderCustomBarLabel = ({ payload, x, y, width, height, value }) => {
  <text x={x + width / 2} y={y} fill="#666" textAnchor="middle" dy={-6}>{`value: ${payload.value}`}</text>;
};

// const MeanLabel = ({ x, y, mean}) => {
//   return (
//     // <div>
//     <foreignObject className={styles.labelWrapper} x={mean} y="0">
//       <svg width={"3em"} height={"1em"}>
//         <rect x={0} y={0} width={"3em"} height={"1em"} fill={"#fff"} /> {/* Colored rectangle */}
//         <text x={"3em" / 2} y={"1em" / 2} dominantBaseline="middle" textAnchor="middle">
//           {mean} {/* Text on top of the rectangle */}
//         </text>
//       </svg>
//     </foreignObject>
//   )
// }

const TooltipReferenceLine = ({ x, children, ...otherProps }) => (
  <Tooltip content={children} trigger="none"> {/* Disable default trigger */}
    <ReferenceLine x={x} {...otherProps} />
  </Tooltip>
);


const formatLabel = () => {
  console.log("WE ARE SUPPOSED TO FORMAT THIS LABEL?")
}

// const element = document.getElementById("prior_label");


// element.addEventListener("click", () => {
//   element.style.zIndex = 10; // Set a high z-index value to bring it to front
// });
const HueAxisLabel = ({ ...props }) => {
  return (
    <g>
      <defs>
        <linearGradient id="hueSpectrum" x1="0%" y1="0%" x2="100%" y2="0%">
          {Array(361)
            .fill(0)
            .map((_, i) => (
              <stop key={i} offset={`${i / 360}%`} stopColor={`hsl(${i}, 100%, 100%)`} />
            ))}
        </linearGradient>
      </defs>
      <rect
        x={props.viewBox.x}
        y={props.viewBox.y}
        width={props.width || 100} // Set width or use provided props.width
        height={props.height || 20} // Set height or use provided props.height
        fill={`url(#hueSpectrum)`}
      />
    </g>
  )
}

const MeanLabel = ({ ...props }) => {
  return (
    <g>
      <foreignObject x={props.viewBox.x} y={props.viewBox.y} width={(String(props.value).length * 10 + 5)} height={20}>
        <div id={props.id}
          style={{ backgroundColor: props.fill, margin: "1px", color: "#ffffff", display: "flex", maxWidth: "2em", flexWrap: "wrap", padding: "0.1em" }}>{props.id == "prior_label" || props.id == "custom_label" ? (props.value) : (props.value.toFixed(2))}
        </div>
      </foreignObject>
    </g>
  )
}

const LikelihoodLabel = ({ ...props }) => {
  return (
    <h5 style={{ transform: 'rotate(-90deg)', writingMode: 'vertical-rl' }}>
      Likelihood
    </h5>
  );
};


const getGaussianPanel = (props) => {
  const plot = props.data.plot
  return (
    <Box className={styles.dataRow} style={{ marginTop: "-1.5em" }}>
      {getParameterLabels(props)}
      <Box className={styles.dataCol}>
        {/* <img src={FontDist} className={styles.visHeading} /> */}
        <Box className={styles.chartBox}>
          <Box className={styles.dataCol}>
            <h3 style={{ marginTop: "-0.2em" }}>Distributions</h3>
            <p style={{ marginBottom: "2em", width: "100%" }}>You can find out more about how the data is distributed here based on what you believe, what you see and what the true distribution actually is.</p>
            <ResponsiveContainer width={'90%'} aspect={1.75} style={{ marginBottom: "-1em" }}>
              <LineChart width={900} height={600} data={plot.gaussian}>
                <XAxis
                  allowDecimals={false}
                  dataKey="input"
                  type="number"
                >
                  <Label value="Mean" offset={0} position="insideBottom" />
                </XAxis>
                <YAxis allowDecimals={true}
                  label={{ value: 'Likelihood', angle: -90, position: 'insideLeft', textAnchor: 'middle' }}
                />
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

                {plot.meanLines ? (
                  plot.activeDistributions.map((key) => (
                    <ReferenceLine
                      x={plot.means[key]}
                      key={plot.means[key]}
                      label={<Label
                        id={key + "_label"}
                        value={plot.means[key]}
                        distName={key}
                        fill={key.includes("ps") ? plot.styles["ps-options"].stroke : plot.styles[key].stroke}
                        position="insideBottom"
                        offset={0}
                        content={<MeanLabel />} />
                      }
                      strokeDasharray={key.includes("ps") ? plot.styles["ps-options"].strokeDasharray : null}
                      // label={plot.means[key]}
                      stroke={key.includes("ps") ? plot.styles["ps-options"].stroke : plot.styles[key].stroke}
                      strokeWidth={key.includes("ps") ? plot.styles["ps-options"].strokeWidth : plot.styles[key].strokeWidth}
                    />
                  ))
                ) : null}
                {/* <ReferenceLine x={} /> */}
                <Legend content={<GaussianLegend plot={plot} props={props} />} />
                <Tooltip content={<GaussianTooltip plot={plot} />} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
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

const getPosteriorNs = (props) => {
  const active = props.activeModel
  return (
    <div className={styles.paramBox}>
      <h4> Updated Beliefs 🔍</h4>
      <Box className={styles.sbuttonRow}>
        how many?
        <input
          type="text"
          id={formatId(active, "posteriorNValue")}
          style={{ color: "#00B295", marginLeft: "7.5em" }}
          maxLength="4" // Restrict to 8 characters
          defaultValue={2} // Set initial value
          className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.zoomPitch)}
          onChange={(event) => {
            const newValue = parseFloat(event.target.value);
            if (!isNaN(newValue) && newValue >= 0 && newValue <= 5) {
              document.getElementById(formatId(active, "posteriorN")).value = Math.floor(newValue);
            }
          }}
        />
      </Box>
      <Box className={styles.gaussianButtonRow}>
        {console.log("deciding whether to grey the button out or not. Samples / length = ")}
        {console.log(props.data)}
        {console.log(props.data.samples)}
        {console.log(props.data.samples.length)}

        {props.data.samples.length > 0 ? (  // Only render active button if samples exist
          <button
            className={styles.gaussianButton}
            style={{ backgroundColor: "#00B295" }} // Active button style
            onClick={() => props.updateChart(active, 'ps')}
          >
            <h4>Update</h4>
            {/* <img className={styles.buttonIconRight} /> */}
          </button>
        ) : (  // Render inactive button without samples
          <button
            className={styles.gaussianButton}
            style={{ backgroundColor: "#ccc", pointerEvents: "none" }} // Disabled button style (grayed out)
            disabled // Explicitly disable the button
          >
            <h4>Update</h4>
            {/* <img className={styles.buttonIconRight} /> */}
          </button>
        )}
      </Box>
    </div>
  )
}

const getParameterLabels = (props) => {
  const active = props.activeModel
  switch (props.data.distribution) {
    case 'gaussian':
      return (
        <div className={styles.params} style={{ marginBottom: "1em" }}>
          <Box className={styles.paramBox}>
            <h4>Ground Truth 🚀</h4>
            <Box className={styles.sbuttonRow}>
              mean
              <input
                type="text"
                id={formatId(active, "groundTruthParamsValue_mu")}
                maxLength="4" // Restrict to 8 characters
                defaultValue={0} // Set initial value
                className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.zoomPitch)}
                style={{ color: "#45BDE5" }}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  if (!isNaN(newValue) && newValue >= 0 && newValue <= 22) {
                    document.getElementById(formatId(active, "groundTruthParamsValue_mu")).value = newValue;
                  }
                }}
              />
            </Box>
            <Box className={styles.sbuttonRow}>
              stdv
              <input
                type="text"
                id={formatId(active, "groundTruthParamsValue_stdv")}
                style={{ color: "#45BDE5" }}
                maxLength="4" // Restrict to 8 characters
                defaultValue={1} // Set initial value
                className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.zoomPitch)}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  if (!isNaN(newValue) && newValue >= 0 && newValue <= 22) {
                    document.getElementById(formatId(active, "groundTruthParamsValue_stdv")).value = newValue;
                  }
                }}
              />
            </Box>

            <Box className={styles.gaussianButtonRow}>
              <button
                className={styles.gaussianButton}
                style={{ backgroundColor: "#45BDE5" }}
                onClick={() => props.updateChart(active, 'groundTruth')}
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
            <h4>Original Belief 😎</h4>
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
                  if (!isNaN(newValue) && newValue != "undefined") {
                    document.getElementById(formatId(active, "priorParamsValue_mu")).value = newValue;
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
                  if (!isNaN(newValue) && newValue >= 0) {
                    document.getElementById(formatId(active, "priorParamsValue_stdv")).value = newValue;
                  }
                }}
              />
            </Box>
            <Box className={styles.gaussianButtonRow}>
              <button
                className={styles.gaussianButton}
                style={{ backgroundColor: "#FFAB1A" }}
                onClick={() => props.updateChart(active, 'prior')}
              >
                <h4>Update</h4>
                <img
                  className={styles.buttonIconRight}
                // src={compassIcon}
                />
              </button>
            </Box>
          </Box>
          {getPosteriorNs(props)}
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

const HueTooltip = ({ active, payload, label, props }) => {
  var shiftFactor = -70
  const index = Number(label)

  if (active && payload && payload.length) { // Check if tooltip is active and has data
    return (
      <div>
        {/* <p>{`${label}: ${payload[0].value}`}</p> */}
        <div className={styles.hueBox}>
          {props.data.plot.hues.hueFamilies[index].map((hex, index) => (
            <div className={styles.hueSwatch} style={{ color: hex, backgroundColor: hex, marginBottom: "0.4em", borderRadius: "0.3em", padding: "0.5em" }}>{hex}</div>
          ))}
        </div>
        <div className={styles.hueBox} style={{ backgroundColor: hueToHex(label), borderRadius: "0.3em", width: "1.5em", height: "1.5em", padding: "0.5em" }} />
      </div>
    );
  }
  return null;
};

const RhythmTooltip = ({ active, payload, label, ...props }) => {
  console.log("PROPS?")
  console.log(props)
  if (active && payload && payload.length) { // Check if tooltip is active and has data
    return (
      <div>
        <p>{`${label}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const handleHueClick = (data, index) => {
  { console.log("WECLICKED THE CHART!!!") }
  { console.log(data) }
  { console.log(index) }
};

const getHuePanel = (props) => {
  const plot = props.data.plot
  return (
    <Box className={styles.dataRow} style={{ marginLeft: "-1em" }} >
      <Box className={styles.chartBox}>
        {props.data.samples.length > 0 ? (
          <div style={{ justifyContent: "center", alignItems: "center" }}><h4>Hue Proportions</h4>
            <Box className={styles.hueChartBox}>
              <ResponsiveContainer width={'99%'} aspect={1} styles={{ justifyContent: "center", marginBottom: "-6em" }}>
                <div style={{ display: "flex", flexDirection: "row" }}>
                  <PieChart width={600} height={600} style={{ marginRight: "-4em", marginTop: "-3em" }}>
                    <Pie
                      data={plot.pie}
                      dataKey={"value"}
                      outerRadius={150}
                      fill={plot.pie.fill}
                    />
                    <Tooltip />
                  </PieChart>
                  <img src={arrowLeftIcon} style={{ width: "8em", marginLeft: "-3em", zIndex: 10 }} />
                </div>
                <button id="spin-btn" className={styles.spinButton} onClick={() => randomRotate(".recharts-pie")}>Spin</button>
              </ResponsiveContainer>
            </Box>
          </div>
        ) : (<div style={{ justifyContent: "center", alignItems: "center" }}><h4>Hue Proportions</h4><p>No samples taken yet!</p></div>)}
      </Box>
      <Box className={styles.chartBox}>
        <Box className={styles.hueChartBox}>
          {/* <ZoomChart data={plot.histogram}/> */}
          <ResponsiveContainer width={'99%'} aspect={1.4}>
            <h4>Hue Distributions</h4>
            <p style={{ marginBottom: "1em", width: "100%" }}>What kind of hues are there, how often do they appear, and how are they spread out?</p>
            <BarChart width={900} height={400} data={plot.histogram} onClick={handleHueClick} style={{ marginTop: "1em" }}>
              <Bar type="monotone" dataKey="value" stroke={plot.histogram.stroke} dot={false} />
              <HueAxisLabel />
              <XAxis
                label={<Label content={<HueAxisLabel />} />}
                tick={<CustomHue />}
                offset={0}
                // interval={0}
                tickInterval={1}
                axisLine={{
                  stroke: "#ddd",
                  strokeWidth: 3,
                  strokeLinecap: "round", // Set rounded line ends
                }}
                tickLine={false}
              >
                {/* </> */}
              </XAxis>
              <YAxis
                label={{ value: 'Number of Observations', angle: -90, position: 'insideLeft', textAnchor: 'middle' }} 
                dots={false}
                axisLine={{
                  stroke: "#ddd",
                  strokeWidth: 1,
                  strokeLinecap: "round", // Set rounded line ends
                }}
                tickLine={{ strokeWidth: 3 }}
              />
              < Tooltip content={<HueTooltip props={props} />} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>
      <Box>
      </Box>
    </Box>
  );
};

const getRhythmPanel = (props) => {
  const plot = props.data.plot
  const active = props.activeModel
  return (
    <Box className={styles.dataRow} >
      <Box className={styles.chartBox}>
        {props.data.samples.length > 0 ? (
          <div style={{ justifyContent: "center", alignItems: "center" }}><h4>Rhythms</h4>
            <Box className={styles.hueChartBox}>
              <ResponsiveContainer width={'99%'} aspect={1.1} style={{ justifyContent: "center" }}>
                <div style={{ display: "flex", flexDirection: "row" }}>
                  <PieChart width={600} height={600} style={{ marginRight: "-4em", marginTop: "-3em" }}>
                    <Pie
                      data={plot.pie}
                      dataKey={"value"}
                      outerRadius={150}
                      fill={plot.pie.fill}
                    />
                    <Tooltip />
                  </PieChart>
                  <img src={arrowLeftIcon} style={{ width: "8em", marginLeft: "-3em", zIndex: 10 }} />
                </div>
                <button id="spin-btn" className={styles.spinButton} onClick={() => randomRotate(".recharts-pie")}>Spin</button>
              </ResponsiveContainer>
            </Box>
          </div>
        ) : (<div style={{ justifyContent: "center", alignItems: "center" }}><h4>Rhythm Timeline</h4><p>No samples taken yet!</p></div>)}
      </Box>
      <Box className={styles.chartBox}>
        <Box className={styles.hueChartBox}>
          <ResponsiveContainer width={'99%'} aspect={1.3}>
            <h4>Rhythm Timeline</h4>
            <p style={{ marginBottom: "1em", width: "100%" }}>What kind of rhythms are there and when are they played?</p>
            <ScatterChart width={900} height={400} data={plot.timeline} style={{ marginTop: "2em" }}>
              <Scatter type="monotone" dataKey="x" stroke={plot.timeline.stroke} dot={false} />
              <XAxis
                label="Rhythm"
                // tick={<CustomHue />}
                tickInterval={5}
                axisLine={{
                  stroke: "#ddd",
                  strokeWidth: 3,
                  strokeLinecap: "round", // Set rounded line ends
                }}
                tickLine={true}
              />
              <YAxis
                label=""
                dots={false}
                yAxis={-5}
                axisLine={{
                  stroke: "#ddd",
                  strokeWidth: 1,
                  strokeLinecap: "round", // Set rounded line ends
                }}
                tickLine={{ strokeWidth: 3 }}
              />
              < Tooltip content={<RhythmTooltip props={props} />} />
            </ScatterChart>
            <input
              type="range"
              id={formatId(active, "viewFactorValue")}
              min="0"
              max="200"
              step="1"
              defaultValue={0}
              onChange={(event) => {
                const newValue = parseFloat(event.target.value);
                document.getElementById(formatId(active, "viewFactorValue")).value = newValue;
                props.updateChart(active, 'viewFactor')
              }}
            />
            <input
              type="text"
              style={{ display: 'none' }}
              id={formatId(active, "viewFactorValue")}
              maxLength="200" // Restrict to 8 characters
              defaultValue={0} // Set initial value
              className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.zoomPitch)}
              onChange={(event) => {
                const newValue = parseFloat(event.target.value);
                if (!isNaN(newValue) && newValue >= 0 && newValue <= 22) {
                  document.getElementById(formatId(active, "viewFactor")).value = newValue;
                  props.updateChart(active, 'viewFactor')
                }
              }}
            />
          </ResponsiveContainer>
        </Box>
      </Box>
      <Box>
      </Box>
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

const swatchStyle = (samples) => {
  return ({
    backgroundColor: samples.length > 0 ? samples[samples.length - 1] : "#ccc", // Default color
    color: samples.length > 0 ? samples[samples.length - 1] : "#000", // Default color
    border: "3px solid $looks-light-transparent",
    borderRadius: "0.3em",
    width: "10em"
  })
};


const hueSwatchStyle = (samples) => {
  return ({
    backgroundColor: hexToHue(samples[samples.length - 1]), // Default color
    color: hexToHue(samples[samples.length - 1]), // Default color
    border: "2px solid $looks-light-transparent",
    borderRadius: "0.3em",
    width: "10em"
  })
};


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
        {/* <img src={FontCurrentSample} className={styles.statsHeading} /> */}
        {samples.length === 0 ? (
          <>
            <h4>Current Observation</h4>
            <p className={styles.stat}>none</p>
          </>
        ) : (
          data.distribution === "hue" ? (
            <Box className={styles.dataRow}>
              <Box className={styles.dataCol} style={{ marginRight: "4em" }}>
                <h4>Current Observation</h4>
                <p
                  style={swatchStyle(samples)}
                  className={styles.hueStat}
                >X
                </p>
              </Box>
              <Box className={styles.dataCol}>
                <h4>Current Hue</h4>
                <p
                  style={hueSwatchStyle(samples)}
                  className={styles.hueStat}
                >X</p>
              </Box>
            </Box>
          ) : (
            <>
              <h4>Current Observation</h4>
              <p className={styles.stat}>
                {samples[samples.length - 1]}{data.unit}
              </p>
            </>
          )
        )}
      </div>
      <div>
        <h4>Number of Observations</h4>
        <p className={styles.stat}>{samples.length}</p>
      </div>
      {data.distribution === "gaussian" && samples.length > 0 ? (
        <div>
          <h4 style={{ color: "#00B295" }}>Mean of Observations</h4>
          {console.log(samples)}
          <p className={styles.stat}>{(samples.reduce((acc, v) => acc + v, 0) / samples.length).toFixed(2)}</p>
        </div>) : (null)}
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