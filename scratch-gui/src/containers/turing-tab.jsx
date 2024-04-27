// import PropTypes from 'prop-types';
// import React from 'react';
// import bindAll from 'lodash.bindall';
// import {defineMessages, intlShape, injectIntl} from 'react-intl';
// import VM from 'scratch-vm';

// import TuringAssetPanel from '../components/turing-asset-panel/turing-asset-panel.jsx';
// import TuringVizPanel from '../components/turing-viz-panel/turing-viz-panel.jsx';
// import soundIcon from '../components/asset-panel/icon--sound.svg';
// import soundIconRtl from '../components/asset-panel/icon--sound-rtl.svg';
// import addSampleFromLibraryIcon from '../components/asset-panel/icon--add-sound-lib.svg';
// import addSampleFromRecordingIcon from '../components/asset-panel/icon--add-sound-record.svg';
// import fileUploadIcon from '../components/action-menu/icon--file-upload.svg';
// import surpriseIcon from '../components/action-menu/icon--surprise.svg';
// import searchIcon from '../components/action-menu/icon--search.svg';
// import controlIcon from '../components/action-menu/icon--control-tab.svg';

// import RecordModal from './record-modal.jsx';
// import SampleEditor from './sound-editor.jsx';
// import SampleLibrary from './sound-library.jsx';

// import soundLibraryContent from '../lib/libraries/sounds.json';
// import {handleFileUpload, soundUpload} from '../lib/file-uploader.js';
// import errorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
// import DragConstants from '../lib/drag-constants';
// import downloadBlob from '../lib/download-blob';

// import {connect} from 'react-redux';

// import {
//     closeSampleLibrary,
//     openSampleLibrary,
//     openSampleRecorder
// } from '../reducers/modals';

// import {
//     activateTab,
//     COSTUMES_TAB_INDEX
// } from '../reducers/editor-tab';

// import {setRestore} from '../reducers/restore-deletion';
// import {showStandardAlert, closeAlertWithId} from '../reducers/alerts';

// class TuringTab extends React.Component {
//     constructor (props) {
//         super(props);
//         bindAll(this, [
//             'handleSelectSample',
//             'handleDeleteSample',
//             'handleNewSample',
//         ]);
//         this.state = {selectedItemIndex: 0};
//     }

//     componentWillReceiveProps (nextProps) {
//         const {
//             editingTarget
//         } = nextProps;

//         // If switching editing targets, reset the sound index
//         if (this.props.editingTarget !== editingTarget) {
//             this.setState({selectedItemIndex: 0});
//         } 
//     }

//     handleSelectSample (sampleIndex) {
//         console.log("Selecting sample!")
//         this.setState({selectedItemIndex: sampleIndex});
//     }

//     handleDeleteSample (sampleIndex) {
//         const restoreFun = this.props.vm.deleteSample(sampleIndex); // TODO to implement
//         if (sampleIndex >= this.state.selectedItemIndex) {
//             this.setState({selectedItemIndex: Math.max(0, sampleIndex - 1)});
//         }
//         this.props.dispatchUpdateRestore({restoreFun, deletedItem: 'Sample'});
//     }

//     handleNewSample () {
//         if (!this.props.vm.editingTarget) {
//             return null;
//         }
//         // const sprite = this.props.vm.editingTarget.sprite;
//         const samples = props.data.samples
//         this.setState({selectedItemIndex: Math.max(props.samples.length - 1, 0)});
//     }

//     render () {
//         const {
//             dispatchUpdateRestore, // eslint-disable-line no-unused-vars
//             intl,
//             isRtl,
//             vm,
//         } = this.props;

//         if (!vm.editingTarget) {
//             return null;
//         }

//         const sprite = vm.editingTarget.sprite;
//         const targetId = this.props.vm.editingTarget.id;
//         const targetName = this.props.vm.editingTarget.getName();

//         console.log("inside turing tab, editing target name is: " + targetName)

//         // const sounds = sprite.sounds ? sprite.sounds.map(sound => (
//         //     {
//         //         url: isRtl ? soundIconRtl : soundIcon,
//         //         name: sound.name,
//         //         details: (sound.sampleCount / sound.rate).toFixed(2),
//         //         dragPayload: sound
//         //     }
//         // )) : [];

//         const messages = defineMessages({
//             fileUploadSample: {
//                 defaultMessage: 'Upload Sample',
//                 description: 'Button to upload sound from file in the editor tab',
//                 id: 'gui.soundTab.fileUploadSample'
//             },
//             surpriseSample: {
//                 defaultMessage: 'Surprise',
//                 description: 'Button to get a random sound in the editor tab',
//                 id: 'gui.soundTab.surpriseSample'
//             },
//             recordSample: {
//                 defaultMessage: 'Record',
//                 description: 'Button to record a sound in the editor tab',
//                 id: 'gui.soundTab.recordSample'
//             },
//             addSample: {
//                 defaultMessage: 'Choose a Sample',
//                 description: 'Button to add a sound in the editor tab',
//                 id: 'gui.soundTab.addSampleFromLibrary'
//             }
//         });

//         return (
//                 <TuringAssetPanel
//                     dragType={DragConstants.SAMPLE}
//                     selectedItemIndex={this.state.selectedItemIndex}
//                     onDeleteClick={this.handleDeleteSample}
//                     samples={this.getSamplesForTarget(targetName)} // list of observed samples
//                     data={this.getDataForTarget(targetName)} // gets dictionary of all distribution data for the specific target
//                     vm={this.props.vm}
//                     onItemClick={this.handleSelectSample}
//                     items={this.getSamplesForTarget(targetName)}
//                     dataIsSet={this.props.dataIsSet[targetName]}
//                 >
//                 <TuringVizPanel
//                     vm={this.props.vm}
//                     data={this.getDataForTarget(targetName)}
//                     targetName={targetName}
//                     dataIsSet={this.props.dataIsSet[targetName]}
//                 />
//                 </TuringAssetPanel>
//         );
//     }
// }

// TuringTab.propTypes = {
//     dispatchUpdateRestore: PropTypes.func,
//     editingTarget: PropTypes.string,
//     intl: intlShape,
//     isRtl: PropTypes.bool,
//     vm: PropTypes.instanceOf(VM).isRequired
// };

// const mapStateToProps = state => ({
//     editingTarget: state.scratchGui.targets.editingTarget,
//     isRtl: state.locales.isRtl,
//     data: state.scratchGui.turingData.data,
//     dataIsSet: state.scratchGui.turingData.dataIsSet 
// }); // TTODO why is this not being changed by my emitter?

// const mapDispatchToProps = dispatch => ({
//     onActivateCostumesTab: () => dispatch(activateTab(COSTUMES_TAB_INDEX)),
//     dispatchUpdateRestore: restoreState => {
//         dispatch(setRestore(restoreState));
//     },
// });

// export default errorBoundaryHOC('Sample Tab')(
//     injectIntl(connect(
//         mapStateToProps,
//         mapDispatchToProps
//     )(TuringTab))
// );

import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {defineMessages, intlShape, injectIntl} from 'react-intl';
import VM from 'scratch-vm';

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
        this.state = {selectedItemIndex: 0};
    }

    componentWillReceiveProps (nextProps) {
        const {
            editingTarget
        } = nextProps;

        // If switching editing targets, reset the sound index
        if (this.props.editingTarget !== editingTarget) {
            this.setState({selectedItemIndex: 0});
        } 
    }

    handleSelectSample (sampleIndex) {
        console.log("Selecting sample!")
        this.setState({selectedItemIndex: sampleIndex});
    }

    handleDeleteSample (sampleIndex) {
        const restoreFun = this.props.vm.deleteSample(sampleIndex); // TODO to implement
        if (sampleIndex >= this.state.selectedItemIndex) {
            this.setState({selectedItemIndex: Math.max(0, sampleIndex - 1)});
        }
        this.props.dispatchUpdateRestore({restoreFun, deletedItem: 'Sample'});
    }

    handleNewSample () {
        if (!this.props.vm.editingTarget) {
            return null;
        }
        // const sprite = this.props.vm.editingTarget.sprite;
        const samples = props.data.samples
        this.setState({selectedItemIndex: Math.max(props.samples.length - 1, 0)});
    }

    getDataForTarget = (targetName) => {
        console.log("trying to get data for a target " + this.props.vm.editingTarget.getName())
        if (this.props.dataIsSet[targetName]) { // TODO we need to set data FOR A TARGET, not for the GUI in general
            var targetData = this.props.data[this.props.vm.editingTarget.getName()]
            console.log("returning: ")
            console.log(targetData)
            return targetData
        } else {
            return {}
        }
    }

    getSamplesForTarget = (targetName) => {
        if (this.props.dataIsSet[targetName]) {
            var targetData = this.getDataForTarget()
            console.log("potentially sortable items (ie samples) are...")
            console.log(targetData.samples)
            if (typeof targetData.samples === undefined) {
                return []
            }
            return targetData['samples']
        } else {
            return []
        }
    }

    getVizPanelComponent = (targetName) => {
        // Check if dataIsSet[targetName] exists
        if (typeof this.props.dataIsSet[targetName] !== 'undefined') {
            // Check if dataIsSet[targetName] is true
            if (this.props.dataIsSet[targetName]) {
            {console.log("sending this data to the viz panel...")}
            {console.log(this.props.data[targetName])}
            return (
                <TuringVizPanel
                    vm={this.props.vm} 
                    data={this.props.data[targetName]}
                    dataIsSet={this.props.dataIsSet[targetName]}
                />
            );
            } else {
            return <h1>No data set yet</h1>;
            }
        } else {
            // No dataIsSet property or undefined value, return null
            return null;
        }
    }

    dataSet = (targetName) => {
        console.log("dataset type? " + this.props.dataIsSet[targetName])
        if (this.props.dataIsSet[targetName] === undefined) {
            return false
        } else {
            return this.props.dataIsSet[targetName]
        }
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
        const targetName = this.props.vm.editingTarget.getName();

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
                    selectedItemIndex={this.state.selectedItemIndex}
                    onDeleteClick={this.handleDeleteSample}
                    items={['sample1', 'sample2']}
                    data={{type: 'TIME', unit: 's'}}
                    vm={this.props.vm}
                    onItemClick={this.handleSelectSample}
                    //items={[{name: 1},{name: 2}]}
                >
                {/* <TuringVizPanel
                    vm={this.props.vm}
                    data={this.props.data}
                /> */}
                </TuringAssetPanel>
                // <TuringAssetPanel
                //     dragType={DragConstants.SAMPLE}
                //     selectedItemIndex={this.state.selectedItemIndex}
                //     onDeleteClick={this.handleDeleteSample}
                //     samples={this.getSamplesForTarget(targetName)}
                //     data={this.getDataForTarget(targetName)}
                //     vm={this.props.vm}
                //     onItemClick={this.handleSelectSample}
                //     items={this.getSamplesForTarget(targetName)}
                //     dataIsSet={this.dataSet(targetName)}
                // >
                // {console.log("samples sent: " + this.getSamplesForTarget(targetName))}
                // {console.log("----------is data set for target" + targetName + "? " + this.dataSet(targetName))}
                // {console.log(this.getDataForTarget(targetName))}
                // {this.getVizPanelComponent(targetName)}
                // </TuringAssetPanel>
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