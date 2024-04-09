import PropTypes from 'prop-types';
import React from 'react';
import Box from '../box/box.jsx';
import classNames from 'classnames';
import VM from 'scratch-vm';
import styles from './turing-viz-panel.css';
import { FormattedMessage } from 'react-intl';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Gaussian from '../gaussian/gaussian.jsx'


const TuringVizPanel = props => (
        <Box className={styles.body}>
            <FormattedMessage
                defaultMessage="Sprite Coordinates"
                description="sprite coords"
                id="gui.bayesModal.spriteCoords"
            />
            <br></br>
            <h3>X: {props.data.spriteX}</h3><h3>Y: {props.data.spriteY}</h3>
            <br></br>
            <Box className={classNames(styles.dataRow)}>
            <Box className = {styles.samplesArea}>
                <FormattedMessage
                    defaultMessage="Samples"
                    description="normal dist"
                    id="gui.bayesModal.samples"
                />
            </Box>
            <Box className={styles.dataCol}>
            <FormattedMessage
                defaultMessage="Visualisations"
                description="vis"
                id="gui.bayesModal.vis"
            />
            <Box className={styles.dataRow}>
             <Gaussian 
                name="Gaussian"
                data={props.data.distData}
                lines={props.data.distLines}
             >
             </Gaussian>

                <BarChart width={150} height={200} data={props.data.barData}>
                    <Bar dataKey="value" fill="#8884d8" />
                    <CartesianGrid  strokeDasharray="3 3" />
                    <YAxis />
                </BarChart>
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
