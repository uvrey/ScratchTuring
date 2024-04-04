import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import MapModalComponent from '../components/map-modal/map-modal.jsx';
import VM from 'scratch-vm';
import analytics from '../lib/analytics.js';
import extensionData from '../lib/libraries/extensions/index.jsx';
import {connect} from 'react-redux';

import {closeMapModal} from '../reducers/modals.js';
import {isMicroBitUpdateSupported, selectAndUpdateMicroBit} from '../lib/microbit-update.js';

class MapModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleSurprise',
            'handleCancel',
            // 'handleConnected',
            // 'handleConnecting',
            // 'handleDisconnect',
            // 'handleError',
            // 'handleHelp',
            // 'handleSendUpdate',
            // 'handleUpdatePeripheral'
        ]);
        // this.state = {
        //     extension: extensionData.find(ext => ext.extensionId === props.extensionId),
        //     phase: props.vm.getPeripheralIsConnected(props.extensionId) ?
        //         PHASES.connected : PHASES.scanning
        // };
    }

    handleSurprise() {
        console.log("SURPRISE!")
    }
    // componentDidMount () {
    //     this.props.vm.on('PERIPHERAL_CONNECTED', this.handleConnected);
    //     this.props.vm.on('PERIPHERAL_REQUEST_ERROR', this.handleError);
    // }
    // componentWillUnmount () {
    //     this.props.vm.removeListener('PERIPHERAL_CONNECTED', this.handleConnected);
    //     this.props.vm.removeListener('PERIPHERAL_REQUEST_ERROR', this.handleError);
    // }
    // handleScanning () {
    //     this.setState({
    //         phase: PHASES.scanning
    //     });
    // }
    // handleConnecting (peripheralId) {
    //     this.props.vm.connectPeripheral(this.props.extensionId, peripheralId);
    //     this.setState({
    //         phase: PHASES.connecting
    //     });
    //     analytics.event({
    //         category: 'extensions',
    //         action: 'connecting',
    //         label: this.props.extensionId
    //     });
    // }
    // handleDisconnect () {
    //     try {
    //         this.props.vm.disconnectPeripheral(this.props.extensionId);
    //     } finally {
    //         this.props.onCancel();
    //     }
    // }
    handleCancel () {
        // try {
        //     // If we're not connected to a peripheral, close the websocket so we stop scanning.
        //     // if (!this.props.vm.getPeripheralIsConnected(this.props.extensionId)) {
        //     //     this.props.vm.disconnectPeripheral(this.props.extensionId);
        //     // }
        // } finally {
            // Close the modal.
            this.props.onCancel();
    }
    // handleError () {
    //     // Assume errors that come in during scanning phase are the result of not
    //     // having scratch-link installed.
    //     if (this.state.phase === PHASES.scanning || this.state.phase === PHASES.unavailable) {
    //         this.setState({
    //             phase: PHASES.unavailable
    //         });
    //     } else {
    //         this.setState({
    //             phase: PHASES.error
    //         });
    //         analytics.event({
    //             category: 'extensions',
    //             action: 'connecting error',
    //             label: this.props.extensionId
    //         });
    //     }
    // }
    // handleConnected () {
    //     this.setState({
    //         phase: PHASES.connected
    //     });
    //     analytics.event({
    //         category: 'extensions',
    //         action: 'connected',
    //         label: this.props.extensionId
    //     });
    // }
    // handleHelp () {
    //     window.open(this.state.extension.helpLink, '_blank');
    //     analytics.event({
    //         category: 'extensions',
    //         action: 'help',
    //         label: this.props.extensionId
    //     });
    // }
    // handleUpdatePeripheral () {
    //     this.setState({
    //         phase: PHASES.updatePeripheral
    //     });
    //     analytics.event({
    //         category: 'extensions',
    //         action: 'enter peripheral update flow',
    //         label: this.props.extensionId
    //     });
    // }
    // /**
    //  * Handle sending an update to the peripheral.
    //  * @param {function(number): void} [progressCallback] Optional callback for progress updates in the range of [0..1].
    //  * @returns {Promise} Resolves when the update is complete.
    //  */
    // handleSendUpdate (progressCallback) {
    //     analytics.event({
    //         category: 'extensions',
    //         action: 'send update to peripheral',
    //         label: this.props.extensionId
    //     });

    //     // TODO: get this functionality from the extension
    //     return selectAndUpdateMicroBit(progressCallback);
    // }
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
                // phase={this.state.phase}
                title={"Choose a Map Backdrop!"}
                // useAutoScan={this.state.extension && this.state.extension.useAutoScan}
                vm={this.props.vm}
                onCancel={this.handleCancel}
                name={"Map Background Selector"}
                // onConnected={this.handleConnected}
                // onConnecting={this.handleConnecting}
                // onDisconnect={this.handleDisconnect}
                // onHelp={this.handleHelp}
                // onScanning={this.handleScanning}
                // onSendPeripheralUpdate={canUpdatePeripheral ? this.handleSendUpdate : null}
                // onUpdatePeripheral={canUpdatePeripheral ? this.handleUpdatePeripheral : null}
            />
        );
    }
}

MapModal.propTypes = {
    extensionId: PropTypes.string.isRequired,
    onCancel: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    // extensionId: state.scratchGui.mapModal.extensionId
});

const mapDispatchToProps = dispatch => ({
    onCancel: () => {
        dispatch(closeMapModal());
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MapModal);
