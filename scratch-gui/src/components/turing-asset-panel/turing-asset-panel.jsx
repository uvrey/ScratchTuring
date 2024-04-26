import React from 'react';
import Box from '../box/box.jsx';
import TuringSelector from './turing-selector.jsx';
import styles from './turing-asset-panel.css';

const TuringAssetPanel = props => (
    <Box className={styles.wrapper}>
        {props.dataIsSet ? 
        (<Box>
        {/* <TuringSelector
            className={styles.selector}
            {...props}
        /> */}
        <Box className={styles.detailArea}>
            {props.children}
        </Box>
        </Box>) :  (<Box>
        <TuringSelector
            className={styles.selector}
            {...props}
        />
         <h1>Welcome!</h1>
        </Box>) } 
    </Box>
); // TTODO make welcome screen

TuringAssetPanel.propTypes = {
    ...TuringSelector.propTypes
};

export default TuringAssetPanel;