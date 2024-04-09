import React from 'react';
import PropTypes from 'prop-types';
import Box from '../box/box.jsx';
import TuringSelector from './turing-selector.jsx';
import styles from './turing-asset-panel.css';

const TuringAssetPanel = props => (
    <Box className={styles.wrapper}>
        <TuringSelector
            className={styles.selector}
            {...props}
        />
        <Box className={styles.detailArea}>
            {props.children}
        </Box>
    </Box>
);

TuringAssetPanel.propTypes = {
    mode: PropTypes.node,
    samples: PropTypes.array, // list of time stamps, postions or samples
};

export default TuringAssetPanel;