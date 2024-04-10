import PropTypes from 'prop-types';
import React, {useState} from 'react';
import bindAll from 'lodash.bindall';
import TuringModalComponent from '../components/turing-modal/turing-modal.jsx';
import VM from 'scratch-vm';
import analytics from '../lib/analytics.js';
import extensionData from '../lib/libraries/extensions/index.jsx';
import {connect} from 'react-redux';
import  {setTuringData} from  '../reducers/turing-data.js';

import {closeTuringModal} from '../reducers/modals.js';
import { setVariableValue } from '../lib/variable-utils.js';
import { turingDataInitialState } from '../reducers/turing-data.js';
// import {isMicroBitUpdateSupported, selectAndUpdateMicroBit} from '../lib/microbit-update.js';

class TuringModal extends React.Component {
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
            // 'handleFetchUpdate',
        ]);
        this.state = {
            extension: extensionData.find(ext => ext.extensionId === props.extensionId),
        };
    }
    
    componentDidMount () {
        // this.props.vm.on('BAYES_DATA', (data) => this.handleUpdate(data));
        console.log('modal mounting')
    }
    componentWillUnmount () {
        console.log('modal unmounting')
        // this.props.vm.removeListener('BAYES_DATA', (data) => this.handleUpdate(data));
        // this.props.vm.removeListener('BAYES_ERROR', this.handleError);
    }
    handleCancel () {
        this.props.onCancel();
    }
    handleError () {
        // Assume errors that come in during scanning phase are the result of not
        // having scratch-link installed.
        analytics.event({
            category: 'extensions',
            action: 'turing error',
            label: this.props.extensionId
        });
    }
    handleInit () {
        console.log("WE are initialising a turing?? just got a signal from the runtime :)")
        analytics.event({
            category: 'extensions',
            action: 'turing init',
            label: this.props.extensionId
        });
    }
    handleUpdate = data => {
        console.log("our GUI got data!");
        console.log("the data we got?")
        console.log(data)
        console.log("---")
        // this.props.onUpdateModalData(data)
        console.log("value of data now: " + this.props.data)
      // console.log(typeof this.props.onUpdateModalData)
        // dispatch(setTuringModalData(data));
    };
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
    //         action: 'enter turing update flow',
    //         label: this.props.extensionId
    //     });
    // }
    render () {
        return (
            <TuringModalComponent
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
                // getData={this.handleFetchUpdate}
                data={this.props.data} // send current state to the modal for display
                closeOnClick={this.props.closeOnClick}
                // onScanning={this.handleScanning}
                // onSendPeripheralUpdate={canUpdatePeripheral ? this.handleSendUpdate : null}
                // onUpdatePeripheral={canUpdatePeripheral ? this.handleUpdatePeripheral : null}
            />
        );
    }
}

TuringModal.propTypes = {
    extensionId: PropTypes.string,
    onCancel: PropTypes.func,
    vm: PropTypes.instanceOf(VM)
};

const mapStateToProps = state => ({
    extensionId: state.scratchGui.turingModal.extensionId,
    data: state.scratchGui.turingData.data, 
});

const mapDispatchToProps = dispatch => ({
    onCancel: () => {
        dispatch(closeTuringModal());
    },
    onUpdateModalData: data => {
        dispatch(setTuringData(data));
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(TuringModal);
