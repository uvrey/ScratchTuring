import {FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import React from 'react';

import Box from '../box/box.jsx';
import Dots from './dots.jsx';
import helpIcon from './icons/help.svg';
import backIcon from './icons/back.svg';
import bluetoothIcon from './icons/bluetooth.svg';
import scratchLinkIcon from './icons/scratchlink.svg';

import surpriseIcon from '../action-menu/icon--surprise.svg'
import searchIcon from '../action-menu/icon--search.svg';
import globeIcon from '../action-menu/icon--globe.svg';
import compassIcon from '../action-menu/icon--compass.svg';
import mapUploadIcon from '../action-menu/icon--map-upload.svg';

import styles from './map-modal.css';

const MenuStep = props => (
    <Box>HELO!</Box>
    // <Box className={styles.body}>

    //     <Box className={styles.buttonRow}>
    //         <button
    //             className={styles.mapOptionsButton}
    //             onClick={props.onCoords}
    //         >
    //             <FormattedMessage
    //                 defaultMessage="Get Coordinates"
    //                 description="Button in prompt for starting a search"
    //                 id="gui.mapModal.getCoords"
    //             />
    //             <img
    //             className={styles.buttonIconRight}
    //                 src={compassIcon}
    //             />
    //         </button>

    //         <button
    //             className={styles.mapOptionsButton}
    //             onClick={props.onSurprise}
    //         >
    //             <FormattedMessage
    //                 defaultMessage="Surprise Me"
    //                 description="Button in prompt for starting a search"
    //                 id="gui.mapModal.surprise"
    //             />
    //             <img
    //                 className={styles.buttonIconRight}
    //                 src={surpriseIcon}
    //             />
    //         </button>
    //     </Box>
    // </Box> 
);

MenuStep.propTypes = {
    onHelp: PropTypes.func,
    onScanning: PropTypes.func,
    onCoords: PropTypes.func,
    onSurprise: PropTypes.func
};

export default MenuStep;
