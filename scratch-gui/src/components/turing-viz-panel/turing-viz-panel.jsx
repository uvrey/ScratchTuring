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
import octopusIcon from './icon--octopus.svg'
import FontBarChart from './font--barChart.svg'
import FontDist from './font--normalDist.svg'
import FontCurrentSample from './font--currentSample.svg'
import FontNumSamples from './font--samples.svg'
import FontType from './font--value.svg'
import Carousel from './carousel.jsx'
// import MeanPlot from '../mean-plot/mean-p[].jsx'


const ThreeColumnLayout = ({ children }) => {
  return (
    <div className="three-column-layout">
      {children}
    </div>
  );
};

const ThreeColumnLayoutItem = ({ children }) => {
  return (
    <div className="three-column-layout-item">{children}</div>
  );
};

const getIntroOfPage = (label) => {
    if (label === 'Page A') {
      return "Page A is about men's clothing";
    }
    if (label === 'Page B') {
      return "Page B is about women's dress";
    }
    if (label === 'Page C') {
      return "Page C is about women's bag";
    }
    if (label === 'Page D') {
      return 'Page D is about household goods';
    }
    if (label === 'Page E') {
      return 'Page E is about food';
    }
    if (label === 'Page F') {
      return 'Page F is about baby food';
    }
    return '';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          <p className={styles.chartLabel}>{`Average: ${payload[0].value} sec`}</p>
          <p className="intro">{getIntroOfPage(label)}</p>
        </div>
      );
    }
    return null;
  };


  const getParameterLabels = (props) => {
    console.log("getting labels");
      switch (props.data.user_model.distribution) {
        case 'gaussian':
          return (
            <div>
            <div>Gaussian: <h1>μ</h1>
            <input
              type="text"
              id="gaussian_mu" 
              maxLength="8" // Restrict to 8 characters
              defaultValue={1} // Set initial value
              // className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.longLat)}
              onChange={(event) => {
              const newValue = parseFloat(event.target.value);
              if (!isNaN(newValue) && newValue >= -90 && newValue <= 90) {
                  document.getElementById("gaussian_mu").value = newValue;
              }
              }}
            />
            </div>
            <h1>σ²</h1>
            <input
              type="text"
              id="gaussian_std" 
              maxLength="8" // Restrict to 8 characters
              defaultValue={1} // Set initial value
              // className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.longLat)}
              onChange={(event) => {
              const newValue = parseFloat(event.target.value);
              if (!isNaN(newValue) && newValue >= -90 && newValue <= 90) {
                  document.getElementById("gaussian_std").value = newValue;
              }
              }}
            />

            <label for="groundTruth">
              <p>Show Ground Truth</p>
              <input type="checkbox" id="groundTruth" name="groundTruth" value="yes"/>  
            </label>

            <label for="prior">
              <p>Show Prior</p>
              <input type="checkbox" id="prior" name="prior" value="yes"/>  
            </label>

            <label for="Posterior">
              <p>Show Posterior</p>
              <input type="checkbox" id="Posterior" name="Posterior" value="yes"/>  
            </label>

            <Box className={styles.buttonRow}>
                <button
                    className={styles.mapOptionsButton}
                    onClick={props.onCoords}
                >
                    <FormattedMessage
                        defaultMessage="Update Prior"
                        description="Button in prompt for starting a search"
                        id="gui.mapModal.getCoords"
                    />
                    <img
                    className={styles.buttonIconRight}
                        // src={compassIcon}
                    />
                </button>

                <button
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
                </button>
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
              
                <img src={FontDashboard} className={styles.dashboard} />
                {console.log("Building visualisation panel :) here's what we have!")}
                {console.log(props.data)}

                <Box className={styles.keyStats}>
                        <div>
                            <img src={FontType} className={styles.statsHeading} />
                            <div><p className={styles.stat}>{props.data.user_model.modelName}</p><p>({props.data.user_model.randomVar})</p></div>
                        </div>
                        <div>
                        <img src={FontCurrentSample} className={styles.statsHeading} />
                          {(props.data.samples.length == 0) ? (<p className={styles.stat}>none</p>) : (<p className={styles.stat}>{props.data.samples[props.data.samples.length-1]}{props.data.user_model.unit}</p>)} 
                        </div>
                        <div>
                        <img src={FontNumSamples} className={styles.statsHeading} />
                          <p className={styles.stat}>{props.data.samples.length}</p>
                        </div>
                </Box>

                <Box className={styles.dataRow}>
                <Box className={styles.dataCol}>
                <img src={FontBarChart} className={styles.visHeading} />
                <BarChart width={500} height={300} data={props.data.barData} className={styles.chartElement}>
                    <Bar key={props.data.barData.type} fill="#855CD6" isAnimationActive={true} dataKey="value" barsize={10}/>
                <XAxis dataKey="type" />
                <Tooltip content={<CustomTooltip/>}/>
                <YAxis />
                </BarChart>
                </Box>

                <Box className={styles.dataCol}>
                <img src={FontDist} className={styles.visHeading} />
                <LineChart width={600} height={300} data={props.data.distData}>
                <XAxis
                    allowDecimals={false}
                    dataKey="input"
                    type="number"
                />
                <YAxis allowDecimals={true} />
                <CartesianGrid stroke="#eee" strokeDasharray="5 5" />


                {console.log("active distributions??")}
                {console.log(props.data.activeDists)}

                {props.data.activeDists.map((key) => (
                    <Line
                      key={key}
                      dataKey={key}
                      type = "monotone"
                      stroke={"#000000"}
                      dot={false}
                      isAnimationActive={true}
                      strokeWidth="1.5px"
                    />
                ))}
                <Legend />
                <Tooltip />
                </LineChart>

                <Box>
                {getParameterLabels(props)}
                </Box>
                </Box>
                </Box>
                </Box>
      </Box>
);

TuringVizPanel.propTypes = {
    data: PropTypes.object,
    vm: PropTypes.instanceOf(VM),
};

TuringVizPanel.defaultProps = {
    connectingMessage: 'Connecting'
};

export {
    TuringVizPanel as default,
};


            {/* <Box className={styles.dataRow}> */}
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
