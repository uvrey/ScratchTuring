import React from 'react';
import Box from '../box/box.jsx';
import TuringSelector from './turing-selector.jsx';
import styles from './turing-asset-panel.css';

import { FormattedMessage } from 'react-intl';

const TuringAssetPanel = props => (

    <Box className={styles.wrapper}>
        <Box className={styles.wrapper}>
            <TuringSelector
                className={styles.selector}
                modelName={props.activeModels[props.activeModelIndex]}
                {...props}
            />
            <Box className={styles.detailArea}>
                {props.children}
            </Box>
        </Box>
    </Box>
);

TuringAssetPanel.propTypes = {
    ...TuringSelector.propTypes
};

export default TuringAssetPanel;