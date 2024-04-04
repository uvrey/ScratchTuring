import PropTypes from 'prop-types';
import React from 'react';
import keyMirror from 'keymirror';

import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';
// import ScanningStep from '../../containers/scanning-step.jsx';
// import AutoScanningStep from '../../containers/auto-scanning-step.jsx';
// import ConnectingStep from './connecting-step.jsx';
// import ConnectedStep from './connected-step.jsx';
// import ErrorStep from './error-step.jsx';
// import UnavailableStep from './unavailable-step.jsx';
// import UpdatePeripheralStep from './update-peripheral-step.jsx';

import surpriseIcon from '../action-menu/icon--surprise.svg'
import searchIcon from '../action-menu/icon--search.svg';
import globeIcon from '../action-menu/icon--globe.svg';
import compassIcon from '../action-menu/icon--compass.svg';
import mapUploadIcon from '../action-menu/icon--map-upload.svg';

import styles from './map-modal.css';
import TargetPane from '../../containers/target-pane.jsx';
import AssetPanel from '../asset-panel/asset-panel.jsx';
import ActionMenu from '../action-menu/action-menu.jsx';
import {defineMessages, intlShape, injectIntl} from 'react-intl';

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
        <ActionMenu
                buttons={[{
                    title: messages.addMap,
                    img: mapUploadIcon,
                    onClick: null
                }, {
                    title: messages.surpriseMap,
                    img: compassIcon,
                    onClick: null
                }, {
                    title: messages.addSound,
                    img: searchIcon,
                    onClick: null
                }]}
                // dragType={DragConstants.SOUND}
            ></ActionMenu>
        </Box>
    </Modal>
);

MapModalComponent.propTypes = {
    // connectingMessage: PropTypes.node.isRequired,
    connectionSmallIconURL: PropTypes.string,
    connectionTipIconURL: PropTypes.string,
    name: PropTypes.node,
    // onCancel: PropTypes.func.isRequired,
    // onHelp: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    // intl: intlShape.isRequired
};

MapModalComponent.defaultProps = {
    connectingMessage: 'Loading'
};

export {
    MapModalComponent as default,
};
