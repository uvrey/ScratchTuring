import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import { defineMessages, intlShape, injectIntl } from 'react-intl';
import VM from 'scratch-vm';

import TuringCarousel from './turing-carousel.jsx';
import Box from '../components/box/box.jsx';
import TuringAssetPanel from '../components/turing-asset-panel/turing-asset-panel.jsx';
import TuringVizPanel from '../components/turing-viz-panel/turing-viz-panel.jsx';
import soundIcon from '../components/asset-panel/icon--sound.svg';
import soundIconRtl from '../components/asset-panel/icon--sound-rtl.svg';
import addSampleFromLibraryIcon from '../components/asset-panel/icon--add-sound-lib.svg';
import addSampleFromRecordingIcon from '../components/asset-panel/icon--add-sound-record.svg';
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

    handleToggleVisibility(vm, data) {
        console.log("Toggle vis: Sending...")
        console.log(data)
        vm.runtime.emit('TOGGLE_VISIBILITY', data)
    }

    handleUpdateToChart(modelName, vm, updateCustom) {
        console.log("handling new values in the selection box")

        const inputs = ["customParamsValue_mu", "customParamsValue_stdv"]; // TODO check if I can use these labels for all models?
        const values = {};
        
        for (const inputName of inputs) {
          const input = document.getElementById(inputName);
          values[inputName] = parseFloat(input.value);
        }

        console.log("WE CAPTURED THESE VALUES DURING THE UPDATE...")
        console.log(values)
        console.log("--------------")

        // Update models on the backend with new information
        var data = {modelName: modelName, mean: values["customParamsValue_mu"], stdv: values["customParamsValue_stdv"]}
        updateCustom(vm, data) 

        // const longitudeValue = values.longitude;
        // const latitudeValue = values.latitude;
        // const zoomValue = values.zoom;
        // const pitchValue = values.pitch;
      
        // try {
        //     var long = parseFloat(longitudeValue);
        //     var lat = parseFloat(latitudeValue);
        //     var zoom = parseFloat(zoomValue);
        //     var pitch = parseFloat(pitchValue);

        //     this.props.onCancel(); // close modal
        //     // check if valid 
        //     this.handleFetchingMap(lat, long, zoom, pitch)

        //   } catch (error) {
        //     console.log(error)
        //     this.props.onShowMapError()
        //     console.log("Please enter valid numbers for longitude and latitude.");
        //     return; 
        //   }
    }
    
    handleUpdateCustom(vm, data) {
        console.log("Sending...")
        console.log(data)
        vm.runtime.emit('UPDATE_CUSTOM_PARAMS', data)
    }

    handleUpdatePrior(vm, data) {
        vm.runtime.emit('UPDATE_PRIOR_PARAMS', data)
       //this.propsvm.runtime.emit('UPDATE_CUSTOM_PARAMS', data)
    }

    handleUpdateGroundTruth(vm, data) {
        vm.runtime.emit('UPDATE_GROUND_TRUTH_PARAMS', data)
      //  this.props.vm.runtime.emit('UPDATE_CUSTOM_PARAMS', data)
    }

    getStoredValue(value, defaultValue) {
        try {
            return localStorage.getItem(value);
        }  catch (error) {
            return defaultValue; 
        }
    }

    getTuringCheckbox(props) {
        const [selectedKey, setSelectedKey] = useState(null); // Stores the selected key

        const handleCheckboxChange = (event) => {
            const newSelectedKey = event.target.value;
            if (newSelectedKey !== selectedKey) { // Only update if different key is selected
                setSelectedKey(newSelectedKey);
            }
        };

        return (
            <div>
                {Object.keys(props.items).map((key) => (
                    <label key={key}>
                        <input
                            type="checkbox"
                            value={key}
                            checked={selectedKey === key} // Set checked based on selectedKey
                            onChange={handleCheckboxChange}
                        />
                        {key}
                    </label>
                ))}
            </div>
        );
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
                        updateCustom={this.handleUpdateCustom}
                        updatePrior={this.handleUpdatePrior}
                        updateGroundTruth={this.handleUpdateGroundTruth}
                        toggleVisibility={this.handleToggleVisibility}
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
    dataIsSet: state.scratchGui.turingData.dataIsSet
});

const mapDispatchToProps = dispatch => ({
    onActivateCostumesTab: () => dispatch(activateTab(COSTUMES_TAB_INDEX)),
    dispatchUpdateRestore: restoreState => {
        dispatch(setRestore(restoreState));
    },
});

export default errorBoundaryHOC('Sample Tab')(
    injectIntl(connect(
        mapStateToProps,
        mapDispatchToProps
    )(TuringTab))
);
