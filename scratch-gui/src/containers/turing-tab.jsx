import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {defineMessages, intlShape, injectIntl} from 'react-intl';
import VM from 'scratch-vm';

import TuringCarousel from './turing-carousel.jsx';
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
import {handleFileUpload, soundUpload} from '../lib/file-uploader.js';
import errorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import DragConstants from '../lib/drag-constants';
import downloadBlob from '../lib/download-blob';

import {connect} from 'react-redux';

import {
    closeSampleLibrary,
    openSampleLibrary,
    openSampleRecorder
} from '../reducers/modals';

import {
    activateTab,
    COSTUMES_TAB_INDEX
} from '../reducers/editor-tab';

import {setRestore} from '../reducers/restore-deletion';
import {showStandardAlert, closeAlertWithId} from '../reducers/alerts';

class TuringTab extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleSelectSample',
            'handleDeleteSample',
            'handleNewSample',
        ]);
        this.state = {selectedSampleIndex: 0};
    }

    componentWillReceiveProps (nextProps) {
        const {
            editingTarget
        } = nextProps;

        // If switching editing targets, reset the sound index
        if (this.props.editingTarget !== editingTarget) {
            this.setState({selectedSampleIndex: 0});
        } 
    }

    handleSelectSample (sampleIndex) {
        console.log("Selecting sample!")
        this.setState({selectedSampleIndex: sampleIndex});
    }

    handleDeleteSample (sampleIndex) {
        const restoreFun = this.props.vm.deleteSample(sampleIndex); // TODO to implement
        if (sampleIndex >= this.state.selectedSampleIndex) {
            this.setState({selectedSampleIndex: Math.max(0, sampleIndex - 1)});
        }
        this.props.dispatchUpdateRestore({restoreFun, deletedItem: 'Sample'});
    }

    handleNewSample () {
        if (!this.props.vm.editingTarget) {
            return null;
        }
        // const sprite = this.props.vm.editingTarget.sprite;
        const samples = props.data.samples
        this.setState({selectedSampleIndex: Math.max(props.samples.length - 1, 0)});
    }

            
    getTargetDataState(targetName) {
        return (this.props.dataIsSet == {}) ? (false) : ((this.props.dataIsSet[targetName] == undefined) ? (false) : (this.props.dataIsSet[targetName]));
    }

    getTargetSamples(targetName) {
        return (this.props.dataIsSet == {}) ? ([]) : ((this.props.dataIsSet[targetName] == undefined) ? ([]) : (this.props.data[targetName].samples));
    }

    getTargetData(targetName) {
        return (this.props.dataIsSet == {}) ? ({user_model: {randomVar: 'NONE', unit: ''}}) : ((this.props.dataIsSet[targetName] == undefined) ? 
        ({user_model: {randomVar: 'NONE', unit: ''}}) : (this.props.data[targetName]));
    }

    getModelDataState(modelName) {
        return (this.props.dataIsSet == {}) ? (false) : ((this.props.dataIsSet[modelName] == undefined) ? (false) : (this.props.dataIsSet[modelName]));
    }

    getModelSamples(modelName) {
        return (this.props.dataIsSet == {}) ? ([]) : ((this.props.dataIsSet[modelName] == undefined) ? ([]) : (this.props.data[modelName].samples));
    }

    getModelData(modelName) {
        return (this.props.dataIsSet == {}) ? ({user_model: {randomVar: 'NONE', unit: ''}}) : ((this.props.dataIsSet[modelName] == undefined) ? 
        ({user_model: {randomVar: 'NONE', unit: ''}}) : (this.props.data[modelName]));
    }

    render () {
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
        const modelName = 'height'; //TTODO
 
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
                    samples={this.getModelSamples(modelName)}
                    data={this.getModelData(modelName)}
                    vm={this.props.vm}
                    onItemClick={this.handleSelectSample}
                    items={this.getModelSamples(modelName)}
                    dataIsSet={this.getModelDataState(modelName)}
                >

                {console.log("Active models??")}
                {console.log(this.props.dataIsSet)}

                {console.log("******* data set, samples, data: *********")}
                {console.log(this.getModelDataState(modelName))}
                {console.log(this.getModelSamples(modelName))}
                {console.log(this.getModelData(modelName))}

                {(this.getModelDataState(modelName)) ? 
                ( <TuringVizPanel
                    vm={this.props.vm}
                    data={this.getModelData(modelName)}
                />) : (<h1>No model defined for {modelName}... yet!</h1>)}
                </TuringAssetPanel>
        );
    }
}

TuringTab.propTypes = {
    dispatchUpdateRestore: PropTypes.func,
    editingTarget: PropTypes.string,
    intl: intlShape,
    isRtl: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired
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
