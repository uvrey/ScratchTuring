import PropTypes from 'prop-types';
import React from 'react';
import keyMirror from 'keymirror';
import classNames from 'classnames';
import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';

import styles from './map-modal.css';
import TargetPane from '../../containers/target-pane.jsx';
import AssetPanel from '../asset-panel/asset-panel.jsx';
import ActionMenu from '../action-menu/action-menu.jsx';
import {defineMessages, intlShape, injectIntl, FormattedMessage} from 'react-intl';
import CoordinatesStep from './coords-step.jsx';
import MenuStep from './menu-step.jsx';
import surpriseIcon from '../action-menu/icon--surprise.svg'
import searchIcon from '../action-menu/icon--search.svg';
import globeIcon from '../action-menu/icon--globe.svg';
import compassIcon from '../action-menu/icon--compass.svg';
import mapUploadIcon from '../action-menu/icon--map-upload.svg';

const messages = defineMessages({
    fileUploadSound: {
        defaultMessage: 'Upload Sound',
        description: 'Button to upload sound from file in the editor tab',
        id: 'gui.mapTab.fileUploadSound'
    },
    surpriseSound: {
        defaultMessage: 'Surprise',
        description: 'Button to get a random sound in the editor tab',
        id: 'gui.mapTab.surpriseSound'
    },
    surpriseMap: {
        defaultMessage: 'Surprise Map',
        description: 'Button to get a random sound in the editor tab',
        id: 'gui.mapTab.surpriseMap'
    },
    addSound: {
        defaultMessage: 'Search',
        description: 'Button to add a map in the editor tab',
        id: 'gui.mapTab.addSound'
    },
    addMap: {
        defaultMessage: 'Choose a Map',
        description: 'Button to add a map in the editor tab',
        id: 'gui.mapTab.addMap'
    }
});

const PHASES = keyMirror({
    menu: null,
    coordinates: null,
});

const MapModalComponent = props => (
    <Modal
        className={styles.modalContent}
        contentLabel={props.name} // TODO get this name and image down 
        headerClassName={styles.header}
        headerImage={props.connectionSmallIconURL}
        id={"mapModal"}
        onHelp={props.onHelp}
        onRequestClose={props.onCancel}
     >
        <Box className={styles.body}>

            <Box className={styles.activityArea}>
                <label>Longitude:</label>
                <input
                    type="text"
                    id={"longitude"}
                />
                <label>Latitude:</label>
                 <input
                    type="text"
                    id={"latitude"}
                />
            </Box>
            <Box className={styles.buttonRow}>
                <button
                    className={styles.mapOptionsButton}
                    onClick={props.onCoords}
                >
                    <FormattedMessage
                        defaultMessage="Get Coordinates"
                        description="Button in prompt for starting a search"
                        id="gui.mapModal.getCoords"
                    />
                    <img
                    className={styles.buttonIconRight}
                        src={compassIcon}
                    />
                </button>

                <button
                    className={styles.mapOptionsButton}
                    onClick={props.onSurprise}
                >
                    <FormattedMessage
                        defaultMessage="Surprise Me"
                        description="Button in prompt for starting a search"
                        id="gui.mapModal.surprise"
                    />
                    <img
                        className={styles.buttonIconRight}
                        src={surpriseIcon}
                    />
                </button>
            </Box>
         </Box>
        {/* <MenuStep {...props} />
        {/* {props.phase === PHASES.menu}
        Hello */}
        {/* {props.phase === PHASES.menu && <MenuStep {...props} />}
        {props.phase === PHASES.coordinates && <CoordinatesStep {...props} />} */} 
    </Modal>
);

MapModalComponent.propTypes = {
    name: PropTypes.node,
    onSurprise: PropTypes.func.isRequired,
    onCoords: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    phase: PropTypes.oneOf(Object.keys(PHASES)).isRequired,
};
    // onHelp: PropTypes.func.isRequired,
MapModalComponent.defaultProps = {
    connectingMessage: 'Loading'
};

export {
    MapModalComponent as default,
    PHASES
};
