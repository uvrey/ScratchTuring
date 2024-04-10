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

                <h2>PDF</h2>
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

                <h2>Bar</h2>
                <BarChart width={150} height={200} data={props.data.barData}>
                    <Bar dataKey="prior" fill={props.data.distLines.color} />
                    <CartesianGrid  stroke="#eee" strokeDasharray="5 5"  />
                    <YAxis />
                </BarChart>
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
