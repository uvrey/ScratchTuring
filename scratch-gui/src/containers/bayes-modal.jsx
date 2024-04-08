import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import BayesModalComponent from '../components/bayes-modal/bayes-modal.jsx';
import VM from 'scratch-vm';
import analytics from '../lib/analytics.js';
import extensionData from '../lib/libraries/extensions/index.jsx';
import {connect} from 'react-redux';

import {closeBayesModal} from '../reducers/modals.js';
// import {isMicroBitUpdateSupported, selectAndUpdateMicroBit} from '../lib/microbit-update.js';

class BayesModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            // 'handleScanning',
            'handleCancel',
            // 'handleConnected',
            // 'handleConnecting',
            'handleUpdate',
            'handleError',
            'handleHelp',
        ]);
        this.state = {
            extension: extensionData.find(ext => ext.extensionId === props.extensionId)
        };
    }
    
    componentDidMount () {
        console.log("Mounting bayes modal handler container")
        this.props.vm.on('BAYES_INIT', this.handleInit);
        this.props.vm.on('BAYES_ERROR', this.handleError);
    }
    componentWillUnmount () {
        this.props.vm.removeListener('BAYES_INIT', this.handleInit);
        this.props.vm.removeListener('BAYES_ERROR', this.handleError);
    }
    handleCancel () {
        this.props.onCancel();
    }
    handleError () {
        // Assume errors that come in during scanning phase are the result of not
        // having scratch-link installed.
        analytics.event({
            category: 'extensions',
            action: 'bayes error',
            label: this.props.extensionId
        });
    }
    handleInit () {
        console.log("WE are initialising a bayes?? just got a signal from the runtime :)")
        analytics.event({
            category: 'extensions',
            action: 'bayes init',
            label: this.props.extensionId
        });
    }
    handleHelp () {
        window.open(this.state.extension.helpLink, '_blank');
        analytics.event({
            category: 'extensions',
            action: 'help',
            label: this.props.extensionId
        });
    }
    handleUpdate () { // dynamically adjust the panel based on the data which is observed? TODO
        console.log("handle vis data")
    }
    // handleUpdatePeripheral () {
    //     // this.setState({
    //     //     phase: PHASES.updatePeripheral
    //     // });
    //     analytics.event({
    //         category: 'extensions',
    //         action: 'enter bayes update flow',
    //         label: this.props.extensionId
    //     });
    // }
    render () {
        return (
            <BayesModalComponent
                // connectingMessage={this.state.extension && this.state.extension.connectingMessage}
                // connectionIconURL={this.state.extension && this.state.extension.connectionIconURL}
                // connectionSmallIconURL={this.state.extension && this.state.extension.connectionSmallIconURL}
                // connectionTipIconURL={this.state.extension && this.state.extension.connectionTipIconURL}
                extensionId={this.props.extensionId}
                name={this.state.extension && this.state.extension.name}
                // phase={this.state.phase}
                title={this.props.extensionId}
                // useAutoScan={this.state.extension && this.state.extension.useAutoScan}
                vm={this.props.vm}
                onCancel={this.handleCancel}
                // onConnected={this.handleConnected}
                // onConnecting={this.handleConnecting}
                // onDisconnect={this.handleDisconnect}
                onHelp={this.handleHelp}
                // onScanning={this.handleScanning}
                // onSendPeripheralUpdate={canUpdatePeripheral ? this.handleSendUpdate : null}
                // onUpdatePeripheral={canUpdatePeripheral ? this.handleUpdatePeripheral : null}
            />
        );
    }
}

BayesModal.propTypes = {
    extensionId: PropTypes.string,
    onCancel: PropTypes.func,
    vm: PropTypes.instanceOf(VM)
};

const mapStateToProps = state => ({
    extensionId: state.scratchGui.bayesModal.extensionId
});

const mapDispatchToProps = dispatch => ({
    onCancel: () => {
        dispatch(closeBayesModal());
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(BayesModal);
