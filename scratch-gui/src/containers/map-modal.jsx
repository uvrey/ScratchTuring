import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import MapModalComponent, {PHASES} from '../components/map-modal/map-modal.jsx';
import VM from 'scratch-vm';
import analytics from '../lib/analytics.js';
import extensionData from '../lib/libraries/extensions/index.jsx';
import {connect} from 'react-redux';
import {showStandardAlert, closeAlertWithId} from '../reducers/alerts';
import {closeMapModal} from '../reducers/modals.js';
import {costumeUpload, handleMapFromAPI} from '../lib/file-uploader.js';
import {StageSelector, onNewMapBackdrop} from './stage-selector.jsx';

class MapModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleSurprise',
            'handleCancel',
            'handleCoordinates',
            'handleNewMapBackdrop'
        ]);
        this.state = {
            phase: PHASES.menu
        }
    }

    handleNewBackdropFromModal (backdrops_, shouldActivateTab = true) {
        const backdrops = Array.isArray(backdrops_) ? backdrops_ : [backdrops_];
        return Promise.all(backdrops.map(backdrop =>
            this.props.vm.addBackdrop(backdrop.md5, backdrop)
        ))
    }

    handleNewMapBackdrop(buffer, fileType) {
        // Use buffer and fileType for map processing here
        var storage = this.props.vm.runtime.storage
        var fileName = "Map "

        costumeUpload(buffer, fileType, storage, vmCostumes => {
            this.props.vm.setEditingTarget(this.props.id);
            vmCostumes.forEach((costume, i) => {
                costume.name = `${fileName}${i ? i + 1 : ''}`;
            });
            this.handleNewBackdropFromModal(vmCostumes).then(() => {
               console.log("Successfully loaded map.")
            });
        });  
    }

    handleSurprise() {
        this.props.onCancel(); // close Modal
        console.log("Getting a surprise map.")

        // this.props.onActivateTab(MAP_TAB_INDEX);
        const accessToken = 'pk.eyJ1Ijoiam1yMjM5IiwiYSI6ImNsdWp1YjczZzBobm4ycWxpNjFwb3Q3eGgifQ.qOHGVYmd3wr7G9_AGVESMg';

        // Define desired map properties
        var lat = Math.random() * (50.0 + 50.0) - 50.0; // Random latitude between -90 and 90
        var long = Math.random() * (100.0 + 100.0) - 100.0; // Random longitude between -180 and 180

        console.log("Lat, long:")
        console.log(lat +", " + long)

        // var lat = 12.1299
        // var long = 21.12455
        const styleId = 'satellite-streets-v12';
        const zoom = 1;
        const width = 960;
        const height = 720;

        // Build the Static Images API URL
        const imageUrl = `https://api.mapbox.com/styles/v1/mapbox/${styleId}/static/${long},${lat},14.25,0,60/${width}x${height}?access_token=${accessToken}`;

        this.props.onShowMapLoad();

        handleMapFromAPI(imageUrl)
        .then((data) => {
            if (!data || !data.buffer || !data.fileType) {
                throw new Error("Invalid data returned from handleMapFromAPI");
            }

            const { buffer, fileType } = data;
            console.log("we got data");
            console.log(fileType);

            // Proceed with buffer and fileType
            this.handleNewMapBackdrop(buffer, fileType)
            this.props.onCloseMapLoad();
        })
        .catch((error) => {
          console.error("Error fetching map:", error);
          this.props.onCloseMapLoad();
          this.props.onShowMapError(error.message || "An error occurred while loading the map.");
        });
    }

    handleCancel () {
        this.props.onCancel();
    }

    handleCoordinates() {
        // this.props.onCancel(); // close Modal
        console.log("handling coords")
        this.state['phase'] = PHASES.coordinates
    }
 
    render () {
        // const canUpdatePeripheral = (this.props.extensionId === 'microbit') && isMicroBitUpdateSupported();
        return (
            <MapModalComponent
                // connectingMessage={this.state.extension && this.state.extension.connectingMessage}
                // connectionIconURL={this.state.extension && this.state.extension.connectionIconURL}
                // connectionSmallIconURL={this.state.extension && this.state.extension.connectionSmallIconURL}
                // connectionTipIconURL={this.state.extension && this.state.extension.connectionTipIconURL}
                // extensionId={this.props.extensionId}
                // name={this.state.extension && this.state.extension.name}
                phase={this.state.phase}
                title={"Choose a Map Backdrop!"}
                vm={this.props.vm}
                onCancel={this.handleCancel}
                name={"Map Background Selector"}
                onSurprise={this.handleSurprise}
                onCoords={this.handleCoordinates}
                // onHelp={this.handleHelp}
            />
        );
    }
}

MapModal.propTypes = {
    onCancel: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    // extensionId: state.scratchGui.mapModal.extensionId
});

const mapDispatchToProps = dispatch => ({
    onCancel: () => {
        dispatch(closeMapModal());
    },
    onShowMapLoad: () => dispatch(showStandardAlert('loadingMap')),
    onCloseMapLoad: () => dispatch(closeAlertWithId('loadingMap')),
    onShowMapError: () => dispatch(showStandardAlert('loadingMapError')),
    onShowMapLoad: () => dispatch(showStandardAlert('loadingMap')),
    onCloseMapLoad: () => dispatch(closeAlertWithId('loadingMap')),
    onShowMapError: () => dispatch(showStandardAlert('loadingMapError'))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MapModal);
