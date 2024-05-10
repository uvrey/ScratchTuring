import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Box from '../box/box.jsx';
import classNames from 'classnames';
import VM from 'scratch-vm';
import styles from './turing-viz-panel.css';
import { FormattedMessage } from 'react-intl';
import { LineChart, BarChart, Cell, Line, Label, Bar, XAxis, YAxis, PieChart, Sector, Pie, CartesianGrid, ReferenceLine, ReferenceDot, ComposedChart, Tooltip, ZAxis, ScatterChart, Scatter, Legend, ResponsiveContainer } from 'recharts';
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
import Color, { rgbToDecimal } from './color.js'
import arrowLeftIcon from './arrow-left.svg'
import ZoomChart from './turing-viz-zoomChart.jsx'
// import SZoomChart from './turing-viz-zoomChart copy.jsx'
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
  const color = hueToHex(hue);
  return (
    <rect
      className={styles.hueBox}
      x={props.x}
      y={props.y}
      width="5%"
      height="2em"
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


const GaussianTooltip = ({ active, payload, label, props, plot }) => {

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
            <p key={formatId(props.activeModel, payload[index])}> {/* Add unique key for each item */}
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
      <label htmlFor={formatId(props.activeModel, "helpfulTooltipGaussian")} className={styles.checkboxLabel}>
        <input
          id={formatId(props.activeModel, "helpfulTooltipGaussian")}
          type="checkbox"
          className={styles.chartCheckbox}
          onChange={() => props.updateChart(props.activeModel, 'tooltip')}
        // Add a default checked state if needed (optional)
        />
        Helpful tooltip
      </label>
      <label htmlFor={formatId(props.activeModel, "meanLines")} className={styles.checkboxLabel}>
        <input
          id={formatId(props.activeModel, "meanLines")}
          className={styles.chartCheckbox}
          type="checkbox"
          onChange={() => props.updateChart(props.activeModel, 'meanLines')}
        />
        Mean Lines
      </label>
    </div>

  </div>
);

const HueLegend = ({ payload, plot, props }) => (
  <div style={{ justifyContent: "center" }}>
    <div style={{ marginTop: "0.5em" }}>
      <label htmlFor={formatId(props.activeModel, "helpfulTooltipHue")} className={styles.checkboxLabel}>
        <input
          id={formatId(props.activeModel, "helpfulTooltipHue")}
          type="checkbox"
          className={styles.chartCheckbox}
          onChange={() => props.updateChart(props.activeModel, 'tooltip')}
        // Add a default checked state if needed (optional)
        />
        Helpful tooltip
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
                <Tooltip content={<GaussianTooltip props = {props} plot={plot} />} />
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
          defaultValue={props.getValue(props, 'n', '')} // Set initial value
          className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.zoomPitch)}
          onChange={(event) => {
            const newValue = parseFloat(event.target.value);
            if (!isNaN(newValue) && newValue >= 0 && newValue <= 5) {
              document.getElementById(formatId(active, "posteriorNValue")).value = Math.floor(newValue);
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
          props.data.plot.fetching ?
            (
              <button  // Render inactive button (combined logic)
                className={styles.gaussianButton}
                style={{ backgroundColor: "#ccc", pointerEvents: "none" }} // Disabled button style
                disabled
              >
                <h4>Update</h4>
                {/* <img className={styles.buttonIconRight} /> */}
              </button>
            ) : ( // Conditionally render based on fetching state
              <button
                className={styles.gaussianButton}
                style={{ backgroundColor: "#00B295" }} // Active button style
                onClick={() => props.updateChart(active, 'ps')}
              >
                <h4>Update</h4>
                {/* <img className={styles.buttonIconRight} /> */}
              </button>
            )
        ) : (
          <button  // Render inactive button (combined logic)
            className={styles.gaussianButton}
            style={{ backgroundColor: "#ccc", pointerEvents: "none" }} // Disabled button style
            disabled
          >
            <h4>Update</h4>
            {/* <img className={styles.buttonIconRight} /> */}
          </button>
        )}

      </Box>
    </div >
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
                defaultValue={props.getValue(props, 'mean', 'groundTruth')}  // Set initial value
                className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.zoomPitch)}
                style={{ color: "#45BDE5" }}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  if (!isNaN(newValue)) {
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
                defaultValue={props.getValue(props, 'stdv', 'groundTruth')}   // Set initial value
                className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.zoomPitch)}
                onChange={(event) => {
                  const newValue = parseFloat(event.target.value);
                  if (!isNaN(newValue) && newValue >= 0) {
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
                defaultValue={props.getValue(props, 'mean', 'prior')}
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
                defaultValue={props.getValue(props, 'stdv', 'prior')}
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
              {props.data.plot.fetching ? (
                <button
                  className={styles.gaussianButton}
                  style={{ backgroundColor: "#ccc", pointerEvents: "none" }}
                  disabled
                >
                  <h4>Update</h4>
                </button>
              ) : (
                <button
                  className={styles.gaussianButton}
                  style={{ backgroundColor: "#FFAB1A" }}
                  onClick={() => props.updateChart(active, 'prior')}
                >
                  <h4>Update</h4>
                  <img
                    className={styles.buttonIconRight}
                  />
                </button>
              )}
            </Box>
          </Box>
          {getPosteriorNs(props)}
        </div>
      ); // Use PascalCase for model names
    default:
      return (<h1>Unknown distribution</h1>);
  }
};

const HueTooltip = ({ active, payload, label, plot }) => {
  const index = Number(label)

  if (active && payload && payload.length) { // Check if tooltip is active and has data
    console.log(payload[0])
    const freq = payload[0].payload.value


    if (plot.helpfulTooltip) {
      return (
        <div>
          <div style={{ backgroundColor: "rgba(33,33,33,0.8)", padding: "0.3em", borderRadius: "0.3em" }}>
            {plot.hues.hueFamilies[index].map((hex, index) => (
              <div className={styles.hueSwatch} style={{ color: hex, backgroundColor: hex, stroke: "#eee", strokeWeight: "3px", marginBottom: "0.4em", borderRadius: "0.3em", padding: "0.5em" }}>{hex}</div>
            ))}
            <div className={styles.dataRow}>
              <div className={styles.hueBox} style={{ backgroundColor: hueToHex(label), stroke: "#eee", strokeWeight: "3px", borderRadius: "0.3em", width: "1.5em", height: "1.5em", padding: "0.5em", marginRight: freq > 0 ? '3px' : '0px' }} />
              {freq > 0 ? (<b style={{ color: "white" }}> x {freq}</b>) : (null)}
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          {/* <p>{`${label}: ${payload[0].value}`}</p> */}
          <div style={{ backgroundColor: "rgba(33,33,33,0.8)", padding: "0.3em", borderRadius: "0.3em" }}>
            <div className={styles.dataRow}>
              <div className={styles.hueBox} style={{ backgroundColor: hueToHex(label), stroke: "#eee", strokeWeight: "3px", borderRadius: "0.3em", width: "1.5em", height: "1.5em", padding: "0.5em", marginRight: freq > 0 ? '3px' : '0px' }} />
              {freq > 0 ? (<b style={{ color: "white" }}> x {freq}</b>) : (null)}
            </div>
          </div>
        </div>
      );
    }
  }
  return null;
};

const HuePieTooltip = ({ active, payload, label, props }) => {
  const index = Number(label)

  if (active && payload && payload.length) { // Check if tooltip is active and has data
    console.log("INSIDE PAYLOAD! of Hue pie tool tip :))")
    console.log(payload)
    console.log("hue to use>")
    const hueToUse = payload[0].payload.h

    return (
      <div className={styles.dataRow} style={{ backgroundColor: `rgba(255,255,255,0.5)`, padding: "0.4em", borderRadius: "0.3em" }}>
        <div className={styles.hueBox} style={{ backgroundColor: hueToHex(hueToUse), borderRadius: "0.3em", width: "1.5em", height: "1.5em", padding: "0.5em", marginRight: "3px" }} /><b>x {payload[0].value}</b>
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
              <ResponsiveContainer width={'99%'} aspect={1} styles={{ justifyContent: "center", marginBottom: "-5em" }}>
                <div style={{ display: "flex", flexDirection: "row" }}>
                  <PieChart width={400} height={400} style={{ marginRight: "-4em", stroke: "#ddd", strokeWidth: "2px" }}>
                    <Pie
                      data={plot.pie}
                      dataKey={"value"}
                      outerRadius={180}
                      fill={plot.pie.fill}
                      stroke={"#ggg"}
                      strokeWeight={"4px"}
                    />
                    <Tooltip content={<HuePieTooltip props={props} />} />
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

          <ResponsiveContainer width={'99%'} aspect={1.4}>
            <h4>Hue Distributions</h4>
            <p style={{ marginBottom: "1em", width: "100%" }}>What kind of hues are there, how often do they appear, and how are they spread out?</p>
            <ZoomChart key={props.activeModel} data={plot.histogram} plot={plot} vizProps={props} stroke={plot.histogram.stroke} />
            {/* <SZoomChart/> */}
            {/* <BarChart
              width={900}
              height={400}
              data={plot.histogram}
              onClick={handleHueClick}
              style={{ marginTop: "1em" }}
            >
              <Bar type="monotone" dataKey="value" stroke={plot.histogram.stroke} dot={false} barSize={20} />
              <XAxis
                tickCount={360}
                visibleTickCount={360} 
                interval={0}
                tick={<CustomHue />}
                offset={0}
                minTickGap={0}
                axisLine={{
                  stroke: "#ddd",
                  strokeWidth: 3,
                  strokeLinecap: "round", 
                }}
                tickLine={false}
              >
              </XAxis>
              <YAxis
                label={{ value: 'Observations', angle: -90, position: 'insideLeft', textAnchor: 'bottom' }}
                style={{ marginTop: '10px' }}
                dots={false}
                axisLine={{
                  stroke: "#ddd",
                  strokeWidth: 1,
                  strokeLinecap: "round", // Set rounded line ends
                }}
                tickLine={{ strokeWidth: 3 }}
              />
              <Legend content={<HueLegend plot={plot} props={props} />} />
              <Tooltip content={<HueTooltip plot={plot} />} />
            </BarChart> */}
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
                  <PieChart width={400} height={400} style={{ marginRight: "-4em", stroke: "#ddd", strokeWidth: "2px" }}>
                    <Pie
                      data={plot.pie}
                      dataKey={"value"}
                      outerRadius={180}
                      fill={plot.pie.fill}
                      stroke={"#ggg"}
                      strokeWeight={"4px"}
                    />
                    {/* <Tooltip content={<RhythmPieTooltip props={props} />} /> */}
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
            {/* <BarChart width={400} height={400} style={{ marginRight: "-4em", stroke: "#ddd", strokeWidth: "2px" }}>
              <Bar
                data={plot.histogram}
                dataKey={"value"}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={plot.pie[index].fill} />
                ))}
              </Bar>
              <Tooltip />
            </BarChart> */}

            {/* <ScatterChart width={900} height={400} data={plot.timeline} style={{ marginTop: "2em" }}>
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
            /> */}
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
          {/* {console.log(samples)} */}
          <p className={styles.stat}>{(samples.reduce((acc, v) => acc + v, 0) / samples.length).toFixed(2)}</p>
        </div>) : (null)}

      <div>
        <button
          className={styles.gaussianButton}
          style={{ backgroundColor: "#ef4a5d" }} // Active button style
          onClick={() => props.deleteModel(props.activeModel)}
        >
          <h4>Delete</h4>
          {/* <img className={styles.buttonIconRight} /> */}
        </button>
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