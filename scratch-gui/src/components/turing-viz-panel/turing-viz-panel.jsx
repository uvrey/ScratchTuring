import PropTypes from 'prop-types';
import React from 'react';
import Box from '../box/box.jsx';
import classNames from 'classnames';
import VM from 'scratch-vm';
import styles from './turing-viz-panel.css';
import { FormattedMessage } from 'react-intl';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Gaussian from '../gaussian/gaussian.jsx'
// import MeanPlot from '../mean-plot/mean-p[].jsx'

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
          {/* <p className="desc">Anything you want can be displayed here.</p> */}
        </div>
      );
    }
    return null;
  };

const TuringVizPanel = props => (
        <Box className={styles.body}>
            {/* <FormattedMessage
                defaultMessage="Sprite Coordinates"
                description="sprite coords"
                id="gui.bayesModal.spriteCoords"
            />
            <br></br>
            <h3>X: {props.data.spriteX}</h3><h3>Y: {props.data.spriteY}</h3>
            <br></br> */}
            <Box className={styles.dataCol}>
            <h1>Dashboard</h1>

                <Box className={styles.keyStats}>
                    <b>Number of Samples:</b> {props.data.samples.length}
                </Box>

                <Box className={styles.dataRow}>
       
                <Box className={styles.dataCol}>
                <h3>Average Values</h3>
                {console.log(props.data.barData[1])}
       
                <BarChart width={200} height={300} data={props.data.barData} className={styles.chartElement}>
                    <Bar key={props.data.barData.type} fill="#45BDE5" isAnimationActive={true} dataKey="value" barsize={10} activeBar={{ stroke: 'red', strokeWidth: 2 }}/>
                <XAxis dataKey="type" />
                <Tooltip content={<CustomTooltip/>}/>
                <YAxis />
                </BarChart>
                </Box>

                <Box className={styles.dataCol}>
                <h3>Probability</h3>
                <LineChart width={730} height={300} data={props.data.distData}>
                <XAxis
                    allowDecimals={false}
                    dataKey="input"
                    type="number"
                />
                <YAxis allowDecimals={true} />
                <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                {props.data.distLines.map((line) => (
                    <Line
                    key={line.id}
                    dataKey={line.id}
                    type = "monotone"
                    stroke={line.stroke}
                    dot={false}
                    isAnimationActive={true}
                    strokeWidth="1.5px"
                    />
                ))}
                <Legend />
                <Tooltip />
                </LineChart>
                </Box>
                </Box>
                </Box>
            </Box>
        // </Box>
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
