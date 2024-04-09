import PropTypes from 'prop-types';
import React from 'react';
import keyMirror from 'keymirror';

import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';
import classNames from 'classnames';
// import ScanningStep from '../../containers/scanning-step.jsx';
// import AutoScanningStep from '../../containers/auto-scanning-step.jsx';
// import ConnectingStep from './connecting-step.jsx';
// import ConnectedStep from './connected-step.jsx';
// import ErrorStep from './error-step.jsx';
// import UnavailableStep from './unavailable-step.jsx';
// import UpdatePeripheralStep from './update-peripheral-step.jsx';
import styles from './bayes-modal.css';
import DraggableModalComponent from '../draggable-modal/draggable-modal.jsx';
import { FormattedMessage } from 'react-intl';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Gaussian from '../gaussian/gaussian.jsx'

const lineData = [
    {
        prior: 4000,
        observed: 2400,
        amt: 2400,
    },
    {

        prior: 3000,
        observed: 1398,
        amt: 2210,
    },
    {
        prior: 2000,
        observed: 9800,
        amt: 2290,
    },
    {
        prior: 2780,
        observed: 3908,
        amt: 2000,
    },
    {
        prior: 1890,
        observed: 4800,
        amt: 2181,
    },
    {
        prior: 2390,
        observed: 3800,
        amt: 2500,
    },
    {
        prior: 3490,
        observed: 4300,
        amt: 2100,
    }
];

const barData = [
    { type: "prior", value: 400 },
    { type: "observed", value: 700 },
    { type: "posterior", value: 200 },
];


const BayesModalComponent = props => (
    <DraggableModalComponent
        className={styles.modalContent}
        contentLabel={props.name}
        headerClassName={styles.header}
        // headerImage={props.connectionSmallIconURL}
        id="bayesModal"
        onHelp={props.onHelp}
        onRequestClose={props.onCancel}
        closeOnClick={false}
    >
        <Box className={styles.body}>
            <Box className={classNames(styles.dataRow)}>
            <Box className = {styles.samplesArea}>
                <FormattedMessage
                    defaultMessage="Samples"
                    description="normal dist"
                    id="gui.bayesModal.samples"
                />
            </Box>
            {/* <Samples>// TODO
                data={data}
            </Samples> */}
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
                    {/* <Box className={styles.dataRow}>
                    <LineChart
                    width={350}
                    height={200}
                    data={lineData}
                    margin={{
                        top: 5,
                        right: 5,
                        left: 5,
                        bottom: 5,
                    }}
                    >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
                    </LineChart>

                    <BarChart width={150} height={200} data={barData}>
                        <Bar dataKey="value" fill="#8884d8" />
                        <CartesianGrid  strokeDasharray="3 3" />
                        <YAxis />
                    </BarChart>
                    </Box>
                    <Box className={styles.dataRow}>
                    <LineChart
                    width={350}
                    height={200}
                    data={lineData}
                    margin={{
                        top: 5,
                        right: 5,
                        left: 5,
                        bottom: 5,
                    }}
                    >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
                    </LineChart>

                    <BarChart width={150} height={200} data={barData}>
                        <Bar dataKey="value" fill="#8884d8" />
                        <CartesianGrid  strokeDasharray="3 3" />
                        <YAxis />
                    </BarChart>
                    </Box> */}
            </Box>

            {/* {props.phase === PHASES.scanning && !props.useAutoScan && <ScanningStep {...props} />}
            {props.phase === PHASES.scanning && props.useAutoScan && <AutoScanningStep {...props} />}
            {props.phase === PHASES.connecting && <ConnectingStep {...props} />}
            {props.phase === PHASES.connected && <ConnectedStep {...props} />}
            {props.phase === PHASES.error && <ErrorStep {...props} />}
            {props.phase === PHASES.unavailable && <UnavailableStep {...props} />}
            {props.phase === PHASES.updatePeripheral && <UpdatePeripheralStep {...props} />} */}
        </Box>
    </DraggableModalComponent>
);

BayesModalComponent.propTypes = {
    // connectingMessage: PropTypes.node.isRequired,
    // connectionSmallIconURL: PropTypes.string,
    // connectionTipIconURL: PropTypes.string,
    name: PropTypes.node, // Todo send name here
    onCancel: PropTypes.func.isRequired,
    onHelp: PropTypes.func.isRequired,
    data: PropTypes.object,
    // phase: PropTypes.oneOf(Object.keys(PHASES)).isRequired,
    // title: PropTypes.string.isRequired,
    // useAutoScan: PropTypes.bool.isRequired
};

BayesModalComponent.defaultProps = {
    connectingMessage: 'Connecting'
};

export {
    BayesModalComponent as default,
};
