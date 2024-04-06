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
import mapModalIcon from './small-map.svg';

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


function updateSliderValue(sliderId) {
    const slider = document.getElementById(sliderId);
    const label = document.getElementById(`${sliderId}Value`);
    label.textContent = slider.value;
}

const MapModalComponent = props => (
    <Modal
        className={styles.modalContent}
        contentLabel={props.name} // TODO get this name and image down 
        headerClassName={styles.header}
        headerImage={mapModalIcon}
        id={"mapModal"}
        onHelp={props.onHelp}
        onRequestClose={props.onCancel}
     >
        <Box className={styles.body}>

          <Box className={styles.sliderArea}>
                <Box className={styles.sliderTitle}>
                    <FormattedMessage
                        defaultMessage="Longitude"
                        description="Longitude label"
                        id="gui.mapModal.longitudeLabel"
                    />
                </Box>

                <Box className={styles.sliderBox}>
                <input
                    type="range"
                    id="longitude"
                    min="-180"
                    max="180"
                    step="0.0001"
                    defaultValue={props.getValue('longitude', 0.1119)}
                    onChange={(event) => {
                        const newValue = parseFloat(event.target.value);
                        document.getElementById("longitudeValue").value = newValue;
                        adjustInputWidth('longitudeValue')
                        updateSliderValue('longitudeValue', newValue); // Assuming your function
                    }}
                />
                <input
                    type="text"
                    id="longitudeValue" 
                    maxLength="8" // Restrict to 8 characters
                    defaultValue={props.getValue('longitude', 0.1119)} // Set initial value
                    className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.longLat)}
                    onChange={(event) => {
                    const newValue = parseFloat(event.target.value);
                    if (!isNaN(newValue) && newValue >= -90 && newValue <= 90) {
                        document.getElementById("longitude").value = newValue;
                        updateSliderValue('longitude', newValue); // Assuming your function
                    }
                    }}
                />
                </Box>

                <Box className={styles.sliderTitle}>
                    <FormattedMessage
                        defaultMessage="Latitude"
                        description="Latitude label"
                        id="gui.mapModal.latitudeLabel"
                    />
                </Box>

                <Box className={styles.sliderBox}>
                <input
                    type="range"
                    id="latitude"
                    min="-90"
                    max="90"
                    step="0.0001"
                    defaultValue={props.getValue('latitude', 52.221)}
                    onChange={(event) => {
                        const newValue = parseFloat(event.target.value);
                        document.getElementById("latitudeValue").value = newValue;
                        adjustInputWidth('latitude')
                        updateSliderValue('latitude', newValue); // Assuming your function
                    }}
                />
                <input
                    type="text"
                    id="latitudeValue" 
                    maxLength="8" // Restrict to 8 characters
                    defaultValue={props.getValue('latitude', 52.221)} // Set initial value
                    className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.longLat)}
                    onChange={(event) => {
                    const newValue = parseFloat(event.target.value);
                    if (!isNaN(newValue) && newValue >= -90 && newValue <= 90) {
                        document.getElementById("latitude").value = newValue;
                        updateSliderValue('latitude', newValue); // Assuming your function
                    }
                    }}
                />
                </Box>

                <Box className={styles.sliderTitle}>
                    <FormattedMessage
                        defaultMessage="Zoom"
                        description="Zoom label"
                        id="gui.mapModal.zoomLabel"
                    />
                </Box>

                <Box className={styles.sliderBox}>
                <input
                    type="range"
                    id="zoom"
                    min="0"
                    max="22"
                    step="0.05"
                    defaultValue={props.getValue('zoom', 0.1119)}
                    onChange={(event) => {
                        const newValue = parseFloat(event.target.value);
                        document.getElementById("zoomValue").value = newValue;
                        adjustInputWidth('zoomValue')
                        updateSliderValue('zoomValue', newValue); // Assuming your function
                    }}
                />
                <input
                    type="text"
                    id="zoomValue" 
                    maxLength="4" // Restrict to 8 characters
                    defaultValue={props.getValue('zoom', 14.25)} // Set initial value
                    className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.zoomPitch)}
                    onChange={(event) => {
                    const newValue = parseFloat(event.target.value);
                    if (!isNaN(newValue) && newValue >= 0 && newValue <= 22) {
                        document.getElementById("zoom").value = newValue;
                        updateSliderValue('zoom', newValue); // Assuming your function
                    }
                    }}
                />
                </Box>

                <Box className={styles.sliderTitle}>
                    <FormattedMessage
                        defaultMessage="Pitch"
                        description="Pitch label"
                        id="gui.mapModal.pitchLabel"
                    />
                </Box>
            
                <Box className={styles.sliderBox}>
                    <input
                    type="range"
                    id="pitch"
                    min="0"
                    max="60"
                    step="0.5"
                        defaultValue={props.getValue('pitch', 60)}
                        onChange={(event) => {
                            const newValue = parseFloat(event.target.value);
                            document.getElementById("pitchValue").value = newValue;
                            adjustInputWidth('pitchValue')
                            updateSliderValue('pitchValue', newValue); // Assuming your function
                        }}
                    />
                    <input
                        type="text"
                        id="pitchValue" 
                        maxLength="4" // Restrict to 8 characters
                        defaultValue={props.getValue('pitch', 60.0)} // Set initial value
                        className={classNames(styles.sliderValue, styles.sliderValueBackground, styles.zoomPitch)}
                        onChange={(event) => {
                        const newValue = parseFloat(event.target.value);
                        if (!isNaN(newValue) && newValue >= 0 && newValue <= 60) {
                            document.getElementById("pitch").value = newValue;
                            updateSliderValue('pitch', newValue); // Assuming your function
                        }
                        }}
                    />
                </Box>

            </Box>
            
            <Box className={styles.buttonRow}>
                <button
                    className={styles.mapOptionsButton}
                    onClick={props.onCoords}
                >
                    <FormattedMessage
                        defaultMessage="Get Map"
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
    getValue: PropTypes.func
};
    // onHelp: PropTypes.func.isRequired,
MapModalComponent.defaultProps = {
    connectingMessage: 'Loading'
};

export {
    MapModalComponent as default,
    PHASES
};
