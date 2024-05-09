import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import { defineMessages, intlShape, injectIntl } from 'react-intl';
import VM from 'scratch-vm';

import TuringAssetPanel from '../components/turing-asset-panel/turing-asset-panel.jsx';
import TuringVizPanel from '../components/turing-viz-panel/turing-viz-panel.jsx';
import soundIcon from '../components/asset-panel/icon--sound.svg';
import soundIconRtl from '../components/asset-panel/icon--sound-rtl.svg';
import fileUploadIcon from '../components/action-menu/icon--file-upload.svg';
import surpriseIcon from '../components/action-menu/icon--surprise.svg';
import searchIcon from '../components/action-menu/icon--search.svg';
import controlIcon from '../components/action-menu/icon--control-tab.svg';

import RecordModal from './record-modal.jsx';
import SampleEditor from './sound-editor.jsx';
import SampleLibrary from './sound-library.jsx';

import soundLibraryContent from '../lib/libraries/sounds.json';
import { handleFileUpload, soundUpload } from '../lib/file-uploader.js';
import errorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import DragConstants from '../lib/drag-constants';
import downloadBlob from '../lib/download-blob';

import { connect } from 'react-redux';

import {
    closeSampleLibrary,
    openSampleLibrary,
    openSampleRecorder
} from '../reducers/modals';

import {
    activateTab,
    COSTUMES_TAB_INDEX
} from '../reducers/editor-tab';

import { setRestore } from '../reducers/restore-deletion';
import { showStandardAlert, closeAlertWithId } from '../reducers/alerts';
import TuringCheckbox from './turing-checkbox.jsx';

class TuringTab extends React.Component {
    constructor(props) {
        super(props);
        bindAll(this, [
            'handleSelectSample',
            'handleDeleteSample',
            'handleNewSample',
            'handleActivateDashboard',
            'getModelDataState',
            'getModelSamples',
            'getModelData',
            'getActiveModels',
            'getActiveModelName',
            'getActiveModelSamples',
            'getActiveModelData',
            'getActiveModelDataState',
            'handleToggleVisibility',
            'handleUpdateToChart',
            //'handleUpdateCustom',
            'handleUpdatePrior',
            'handleUpdateViewFactor',
            'handleUpdatePosteriorN',
            'handleUpdateTooltip',
            'handleUpdateGroundTruth',
            'handleUpdateMeanLines',
            'getStoredValue',
            'handleClearSamples'
        ]);
        this.state = {
            selectedSampleIndex: 0,
            activeModelIndex: 0, // Add activeModelIndex here
        };

        this.handleActivateDashboard = this.handleActivateDashboard.bind(this)
    }

    componentWillReceiveProps(nextProps) {
        const {
            editingTarget
        } = nextProps;

        // If switching editing targets, reset the sound index
        if (this.props.editingTarget !== editingTarget) {
            this.setState({ selectedSampleIndex: 0 });
        }
    }

    handleSelectSample(sampleIndex) {
        console.log("Selecting sample!")
        this.setState({ selectedSampleIndex: sampleIndex });
    }

    handleDeleteSample(sampleIndex) {
        const restoreFun = this.props.vm.deleteSample(sampleIndex); // TODO to implement
        if (sampleIndex >= this.state.selectedSampleIndex) {
            this.setState({ selectedSampleIndex: Math.max(0, sampleIndex - 1) });
        }
        this.props.dispatchUpdateRestore({ restoreFun, deletedItem: 'Sample' });
    }

    handleNewSample() {
        if (!this.props.vm.editingTarget) {
            return null;
        }
        // const sprite = this.props.vm.editingTarget.sprite;
        const samples = props.data.samples
        this.setState({ selectedSampleIndex: Math.max(props.samples.length - 1, 0) });
    }


    handleActivateDashboard(key, index) {
        console.log("(((((((((((((((((((((((");
        console.log("activate the dashboard for " + key + " at " + index);
        this.setState({ activeModelIndex: index });
    }

    getModelDataState(modelName) {
        return (this.props.dataIsSet == {}) ? (false) : ((this.props.dataIsSet[modelName] == undefined) ? (false) : (this.props.dataIsSet[modelName]));
    }

    getModelSamples(modelName) {
        return (this.props.dataIsSet == {}) ? ([]) : ((this.props.dataIsSet[modelName] == undefined) ? ([]) : (this.props.data[modelName].samples));
    }

    getModelData(modelName) {
        return (this.props.dataIsSet == {}) ? ({ user_model: { randomVar: 'NONE', unit: '' } }) : ((this.props.dataIsSet[modelName] == undefined) ?
            ({ user_model: { randomVar: 'NONE', unit: '' } }) : (this.props.data[modelName]));
    }

    getActiveModels(models) {
        var list = []
        for (const m in models) {
            list.push(m)
        }
        return list
    }

    getActiveModelName() {
        return this.getActiveModels(this.props.dataIsSet)[this.state.activeModelIndex]
    }

    getActiveModelSamples() {
        var n = this.getActiveModelName()
        return this.getModelSamples(n)
    }

    getActiveModelData() {
        var n = this.getActiveModelName()
        return this.getModelData(n)
    }

    getActiveModelDataState() {
        var n = this.getActiveModelName()
        return this.getModelDataState(n)
    }

    handleToggleVisibility (data) {
        console.log("Toggle vis: Sending...")
        console.log(data)
        this.props.vm.runtime.emit('TOGGLE_VISIBILITY', data)
    }

    handleUpdateToChart(modelName, mode) {
        console.log("handling new values in the selection box")

        if (mode == "meanLines") {
            var customData = { modelName: modelName }
            this.handleUpdateMeanLines(customData)
            return
        }

        if (mode == "tooltip") {
            var customData = { modelName: modelName }
            this.handleUpdateTooltip(customData)
            return
        }

        if (mode == 'viewFactor') {
            const inputs = [modelName + "_viewFactorValue"]; // TODO check if I can use these labels for all models?
            const values = {};

            for (const inputName of inputs) {
                const input = document.getElementById(inputName);
                const value = parseFloat(input.value);
                if (value === undefined || value !== value || value === "") { // Check for undefined, NaN, and empty string
                  this.props.onParamError()
                  return;
                }
                values[inputName] = value;
              }
          
            var customData = { modelName: modelName, viewFactor: values[modelName + "_viewFactorValue"] }
            this.handleUpdateViewFactor(customData)
            return
        }

        if (mode == 'groundTruth') {
            const inputs = [modelName + "_groundTruthParamsValue_mu", modelName + "_groundTruthParamsValue_stdv"]; // TODO check if I can use these labels for all models?
            const values = {};

            for (const inputName of inputs) {
                const input = document.getElementById(inputName);
                const value = parseFloat(input.value);
                if (value === undefined || value !== value || value === "") { // Check for undefined, NaN, and empty string
                  this.props.onParamError()
                  return;
                }
                values[inputName] = value;
              }
            var customData = { modelName: modelName, mean: values[modelName + "_groundTruthParamsValue_mu"], stdv: values[modelName + "_groundTruthParamsValue_stdv"] }
            this.handleUpdateGroundTruth(customData)
            return
        }

        if (mode == 'prior') {
            const inputs = [modelName + "_priorParamsValue_mu", modelName + "_priorParamsValue_stdv"]; // TODO check if I can use these labels for all models?
            const values = {};

            for (const inputName of inputs) {
                const input = document.getElementById(inputName);
                const value = parseFloat(input.value);
                if (value === undefined || value !== value || value === "") { // Check for undefined, NaN, and empty string
                  this.props.onParamError()
                  return;
                }
                values[inputName] = value;
              }
            var priorData = { modelName: modelName, mean: values[modelName + "_priorParamsValue_mu"], stdv: values[modelName + "_priorParamsValue_stdv"] }
            this.handleUpdatePrior(priorData)
            return
        }

        if (mode == 'ps') {
            const inputs = [modelName + "_posteriorNValue"]; // TODO check if I can use these labels for all models?
            const values = {};
            for (const inputName of inputs) {
                const input = document.getElementById(inputName);
                const value = parseFloat(input.value);
                if (value > 10 || value < 0 || value == NaN || value == undefined) { 
                    this.props.onPosteriorError();
                    return;
                }
                values[inputName] = parseFloat(input.value);
            }
            var psData = { modelName: modelName, n: values[modelName + "_posteriorNValue"] }
            this.handleUpdatePosteriorN(psData)
            return
        }
    }

    handleUpdateGroundTruth(data) {
        console.log("Sending...")
        console.log(data)
        this.props.vm.runtime.emit('UPDATE_CUSTOM_PARAMS', data)
    }

    handleUpdatePrior(data) {
        this.props.vm.runtime.emit('UPDATE_PRIOR_PARAMS', data)
        //this.propsvm.runtime.emit('UPDATE_CUSTOM_PARAMS', data)
    }

    handleUpdateViewFactor(data) {
        this.props.vm.runtime.emit('UPDATE_VIEW_FACTOR', data)
        //this.propsvm.runtime.emit('UPDATE_CUSTOM_PARAMS', data)
    }


    handleUpdatePosteriorN(data) {
        this.props.vm.runtime.emit('UPDATE_POSTERIOR_N', data)
    }

    handleUpdateTooltip(data) {
        console.log("UPDATING TOOLTIP!")
        this.props.vm.runtime.emit('UPDATE_TOOLTIP', data)
    }

    handleUpdateGroundTruth(data) {
        this.props.vm.runtime.emit('UPDATE_GROUND_TRUTH_PARAMS', data)
        //  this.props.vm.runtime.emit('UPDATE_CUSTOM_PARAMS', data)
    }

    handleUpdateMeanLines(data) {
        this.props.vm.runtime.emit('UPDATE_MEAN_LINES', data)
    }

    getStoredValue(value, defaultValue) {
        console.log("@@trying to get the stored value for " + value)
        try {
            console.log("found the value as " + value)
            return localStorage.getItem(value);
        } catch (error) {
            return defaultValue;
        }
    }

    handleDrop() {
        return
    }

    handleClearSamples(modelName) {
        this.props.vm.runtime.emit('CLEAR_SAMPLES', { modelName: modelName })
    }

    render() {
        const {
            dispatchUpdateRestore, // eslint-disable-line no-unused-vars
            intl,
            isRtl,
            vm,
        } = this.props;

        if (!vm.editingTarget) {
            return null;
        }

        const sprite = vm.editingTarget.sprite;
        const targetName = vm.editingTarget.getName();
        const modelName = ''; //TTODO

        const sounds = sprite.sounds ? sprite.sounds.map(sound => (
            {
                url: isRtl ? soundIconRtl : soundIcon,
                name: sound.name,
                details: (sound.sampleCount / sound.rate).toFixed(2),
                dragPayload: sound
            }
        )) : [];

        const messages = defineMessages({
            fileUploadSample: {
                defaultMessage: 'Upload Sample',
                description: 'Button to upload sound from file in the editor tab',
                id: 'gui.soundTab.fileUploadSample'
            },
            surpriseSample: {
                defaultMessage: 'Surprise',
                description: 'Button to get a random sound in the editor tab',
                id: 'gui.soundTab.surpriseSample'
            },
            recordSample: {
                defaultMessage: 'Record',
                description: 'Button to record a sound in the editor tab',
                id: 'gui.soundTab.recordSample'
            },
            addSample: {
                defaultMessage: 'Choose a Sample',
                description: 'Button to add a sound in the editor tab',
                id: 'gui.soundTab.addSampleFromLibrary'
            }
        });



        return (
            <TuringAssetPanel
                dragType={DragConstants.SAMPLE}
                selectedSampleIndex={this.state.selectedSampleIndex}
                onDeleteClick={this.handleDeleteSample}
                samples={this.getActiveModelSamples()}
                onDrop={this.handleDrop()}
                data={this.getActiveModelData()}
                vm={this.props.vm}
                onItemClick={this.handleSelectSample}
                items={this.getActiveModelSamples()}
                dataIsSet={this.getActiveModelDataState()}
                activeModels={this.getActiveModels(this.props.dataIsSet)}
                activateModelDashboard={this.handleActivateDashboard}
                activeModelIndex={this.state.activeModelIndex}
                activeModel={this.getActiveModels(this.props.dataIsSet)[this.state.activeModelIndex]}
                toggleVisbility={this.handleToggleVisibility}
                onClearSamples={this.handleClearSamples}
            >
                {this.getActiveModelDataState() ?
                    (<TuringVizPanel
                        vm={this.props.vm}
                        data={this.getActiveModelData()}
                        dataIsSet={this.getActiveModelDataState()}
                        activeModels={this.getActiveModels(this.props.dataIsSet)}
                        activateModelDashboard={this.handleActivateDashboard}
                        activeModelIndex={this.state.activeModelIndex}
                        activeModel={this.getActiveModels(this.props.dataIsSet)[this.state.activeModelIndex]}
                        getValue={this.getStoredValue}
                        updateChart={this.handleUpdateToChart}
                    />) : (<h1>No models defined... yet!</h1>)}
            </TuringAssetPanel>
        );
    }
}

TuringTab.propTypes = {
    dispatchUpdateRestore: PropTypes.func,
    editingTarget: PropTypes.string,
    intl: intlShape,
    isRtl: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired,
};

const mapStateToProps = state => ({
    editingTarget: state.scratchGui.targets.editingTarget,
    isRtl: state.locales.isRtl,
    data: state.scratchGui.turingData.data,
    dataIsSet: state.scratchGui.turingData.dataIsSet,
});

const mapDispatchToProps = dispatch => ({
    onActivateCostumesTab: () => dispatch(activateTab(COSTUMES_TAB_INDEX)),
    dispatchUpdateRestore: restoreState => {
        dispatch(setRestore(restoreState));
    },
    onPosteriorError: () => dispatch(showStandardAlert('posteriorError')),
    onParamError: () => dispatch(showStandardAlert('paramError'))

});

export default errorBoundaryHOC('Turing Tab')(
    injectIntl(connect(
        mapStateToProps,
        mapDispatchToProps
    )(TuringTab))
);
