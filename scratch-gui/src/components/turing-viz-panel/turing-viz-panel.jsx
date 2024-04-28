import PropTypes from 'prop-types';
import React from 'react';
import Box from '../box/box.jsx';
import classNames from 'classnames';
import VM from 'scratch-vm';
import styles from './turing-viz-panel.css';
import { FormattedMessage } from 'react-intl';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

const formatId = (modelName, label) => {
  return modelName +"_" + label
}

const CUSTOM = 0
const PRIOR = 1

const getParameterLabels = (props) => {
  switch (props.data.user_model.distribution) {
    case 'gaussian':
      return (
        <div>
          {/* <label htmlFor="groundTruth"> //TTODO
            <p>Show Custom Distribution</p>
            <input type="checkbox" onClick={props.toggleVisibility(props.vm, {modelName: props.activeModel, mode: 'custom'})} id="groundTruth" name="groundTruth" value="yes" />
          </label> */}
          <Box className={styles.sliderBox}>
            <h3>Ground Truth</h3>
            <b>mean (μ)</b>
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
            <h3>Ground Truth</h3>
            <b>stdv (σ)</b>
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
            {/* <button
              className={styles.mapOptionsButton}
              onClick={() => props.updateCustom(props.vm, { modelName: props.activeModel, mean: 10, stdv: 0.5 })}
            >
              <FormattedMessage
                defaultMessage="Create a Ground Truth"
                description="Button in prompt for starting a search"
                id="gui.vizPanel.makeGroundTruth"
              />
              <img
                className={styles.buttonIconRight}
              // src={compassIcon}
              />
            </button> */}

            <button
              className={styles.mapOptionsButton}
              onClick={() => props.updateChart(props.activeModel, props.vm, props.updateCustom)}
            >
              <FormattedMessage
                defaultMessage="Update Charts"
                description="Button in prompt for starting a search"
                id="gui.vizPanel.updateCharts"
              />
              <img
                className={styles.buttonIconRight}
              // src={compassIcon}
              />
            </button>

            {/* <button
              className={styles.mapOptionsButton}
              onClick={props.onSurprise}
            >
              <FormattedMessage
                defaultMessage="Create Ground Truth"
                description="Button in prompt for starting a search"
                id="gui.mapModal.surprise"
              />
              <img
                className={styles.buttonIconRight}
              // src={surpriseIcon}
              />
            </button> */}
          </Box>

        </div>


        // 

      ); // Use PascalCase for model names
    case 'poisson':
      return (<div>Poisson: <h1>λ</h1></div>)
    case 'binomial':
      return (<div>Binomial: <h1>n</h1><h1>p</h1></div>)
    default:
      return (<h1>Unknown distribution</h1>);
  }
};


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
      {console.log("Building visualisation panel :) here's what we have!")}
      {console.log(props.data)}


      <Box className={styles.dataRow}>
        {/* <Box className={styles.dataCol}>
          <img src={FontBarChart} className={styles.visHeading} />
          <BarChart width={500} height={300} data={props.data.barData} className={styles.chartElement}>
            <Bar key={props.data.barData.type} fill="#855CD6" isAnimationActive={true} dataKey="value" barsize={10} />
            <XAxis dataKey="type" />
            <Tooltip content={<CustomTooltip />} />
            <YAxis />
          </BarChart>
        </Box> */}
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
      </Box>
      <Box className={styles.dataRow}>
        <Box className={styles.dataCol}>
          <img src={FontDist} className={styles.visHeading} />
          <LineChart width={800} height={400} data={props.data.distData}>
            <XAxis
              allowDecimals={false}
              dataKey="input"
              type="number"
            />
            <YAxis allowDecimals={true} />
            <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
            {props.docTags}
            {props.data.activeDists.map((key) => (
              <Line
                key={key}
                dataKey={key}
                type="monotone"
                stroke={props.data.styles[key].stroke}
                dot={props.data.styles[key].dots}
                isAnimationActive={true}
                strokeWidth={props.data.styles[key].strokeWidth}
              />
            ))}
            {/* <Customized component={CustomizedRectangle} /> */}
            <Legend />
            <Tooltip />
          </LineChart>
        </Box>
        <Box>
          {getParameterLabels(props)}
        </Box>
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
