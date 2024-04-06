import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import MapModalComponent, {PHASES} from '../components/map-modal/map-modal.jsx';
import VM from 'scratch-vm';
import analytics from '../lib/analytics.js';
import {connect} from 'react-redux';
import {showStandardAlert, closeAlertWithId} from '../reducers/alerts';
import {closeMapModal} from '../reducers/modals.js';
import {costumeUpload, handleMapFromAPI} from '../lib/file-uploader.js';

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

    storeModalValues(lat, long, zoom, pitch) {
        console.log("Storing configuration:")
        console.log(long + "," + lat + "," + zoom + "," + pitch)
        localStorage.setItem("longitude", long);
        localStorage.setItem("latitude", lat);
        localStorage.setItem("zoom", zoom);
        localStorage.setItem("pitch", pitch);
      }


    handleFetchingMap(lat, long, zoom, pitch) {
        console.log("Lat, long:")
        console.log(lat +", " + long)

        const styleId = 'satellite-streets-v12';
        const width = 960;
        const height = 720;
        const accessToken = 'pk.eyJ1Ijoiam1yMjM5IiwiYSI6ImNsdWp1YjczZzBobm4ycWxpNjFwb3Q3eGgifQ.qOHGVYmd3wr7G9_AGVESMg';

        console.log("ZOOM & PITCH?")
        console.log(zoom)
        console.log(pitch)

        // Build the Static Images API URL
        const imageUrl = `https://api.mapbox.com/styles/v1/mapbox/${styleId}/static/${long},${lat},${zoom},0,${pitch}/${width}x${height}?access_token=${accessToken}`;

        this.props.onShowMapLoad();

        handleMapFromAPI(imageUrl)
        .then((data) => {
            if (!data || !data.buffer || !data.fileType) {
                throw new Error("Invalid data returned from handleMapFromAPI");
            }

            const { buffer, fileType } = data;

            // Proceed with buffer and fileType
            this.handleNewMapBackdrop(buffer, fileType)
            this.storeModalValues(lat, long, zoom, pitch) // store modal values once set
            this.props.onCloseMapLoad();
        })
        .catch((error) => {
          console.error("Error fetching map:", error);
          this.props.onCloseMapLoad();
          this.props.onShowMapError(error.message || "An error occurred while loading the map.");
        });
    }

    handleSurprise() {
        this.props.onCancel(); // close Modal

        // Define desired map properties
        var lat = Math.random() * (50.0 + 50.0) - 50.0; // Random latitude between -90 and 90
        var long = Math.random() * (100.0 + 100.0) - 100.0; // Random longitude between -180 and 180
        const roundedLat = Math.round(lat * 10000) / 10000;
        const roundedLong = Math.round(long * 10000) / 10000;

        // Fetch the map
        this.handleFetchingMap(roundedLat, roundedLong, 10, 35);
    }

    handleCancel () {
        this.props.onCancel();
    }

    // Test if there are values to fetch
    checkRestore() {
        try {
            console.log("we got a stored value for longitude: ")
            console.log(localStorage.getItem("longitude"));
            return true; // Explicitly return true on success
          } catch (error) {
            return false; // Return false on error
          }
    }

    getStoredValues() {
        const inputs = ["longitude", "latitude", "zoom", "pitch"];
        const storedValues = {};

        if (this.checkRestore()) {
            console.log("we are trying to find coordinates again, but some are already stored")
        } else {
            console.log("No previous coords are stored")
        }
        
        for (const inputName of inputs) {
            storedValues[inputName] = localStorage.getItem(inputName);
        }
        return storedValues
    }

    getStoredValue(value, defaultValue) {
        try {
            return localStorage.getItem(value);
        }  catch (error) {
            return defaultValue; 
        }
    }

    handleCoordinates() {
        const inputs = ["longitude", "latitude", "zoom", "pitch"];
        const values = {};

        if (this.checkRestore()) {
            console.log("we are trying to find coordinates again, but some are already stored")
        } else {
            console.log("No previous coords are stored")
        }
        
        for (const inputName of inputs) {
          const input = document.getElementById(inputName);
          values[inputName] = parseFloat(input.value);
        }
        
        const longitudeValue = values.longitude;
        const latitudeValue = values.latitude;
        const zoomValue = values.zoom;
        const pitchValue = values.pitch;
      
        try {
            var long = parseFloat(longitudeValue);
            var lat = parseFloat(latitudeValue);
            var zoom = parseFloat(zoomValue);
            var pitch = parseFloat(pitchValue);

            this.props.onCancel(); // close modal

            // check if valid 
            this.handleFetchingMap(lat, long, zoom, pitch)

          } catch (error) {
            console.log(error)
            this.props.onShowMapError()
            console.log("Please enter valid numbers for longitude and latitude.");
            return; 
          }
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
                name={"Map Generator"}
                onSurprise={this.handleSurprise}
                onCoords={this.handleCoordinates}
                getValue={this.getStoredValue}
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
