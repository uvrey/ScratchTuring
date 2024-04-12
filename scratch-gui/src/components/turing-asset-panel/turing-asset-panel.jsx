import React from 'react';
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
    ...TuringSelector.propTypes
};

export default TuringAssetPanel;