import bindAll from 'lodash.bindall';
import omit from 'lodash.omit';
import PropTypes from 'prop-types';
import React from 'react';
import {intlShape, injectIntl} from 'react-intl';

import {connect} from 'react-redux';
import {openBackdropLibrary, openMapModal} from '../reducers/modals';
import {activateTab, COSTUMES_TAB_INDEX, MAP_TAB_INDEX} from '../reducers/editor-tab';
import {showStandardAlert, closeAlertWithId} from '../reducers/alerts';
import {setHoveredSprite} from '../reducers/hovered-target';
import DragConstants from '../lib/drag-constants';
import DropAreaHOC from '../lib/drop-area-hoc.jsx';
import ThrottledPropertyHOC from '../lib/throttled-property-hoc.jsx';
import {emptyCostume} from '../lib/empty-assets';
import sharedMessages from '../lib/shared-messages';
import {fetchCode} from '../lib/backpack-api';
import {getEventXY} from '../lib/touch-utils';

import StageSelectorComponent from '../components/stage-selector/stage-selector.jsx';

import backdropLibraryContent from '../lib/libraries/backdrops.json';
import {handleFileUpload, costumeUpload, handleMapFromAPI} from '../lib/file-uploader.js';

const dragTypes = [
    DragConstants.COSTUME,
    DragConstants.SOUND,
    DragConstants.BACKPACK_COSTUME,
    DragConstants.BACKPACK_SOUND,
    DragConstants.BACKPACK_CODE
];

const DroppableThrottledStage = DropAreaHOC(dragTypes)(
    ThrottledPropertyHOC('url', 500)(StageSelectorComponent)
);

class StageSelector extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClick',
            'handleNewBackdrop',
            'handleSurpriseBackdrop',
            'handleEmptyBackdrop',
            'addBackdropFromLibraryItem',
            'handleMap',
            'handleFileUploadClick',
            'handleBackdropUpload',
            'handleMouseEnter',
            'handleMouseLeave',
            'handleTouchEnd',
            'handleDrop',
            'setFileInput',
            'setRef'
        ]);
    }
    componentDidMount () {
        document.addEventListener('touchend', this.handleTouchEnd);
    }
    componentWillUnmount () {
        document.removeEventListener('touchend', this.handleTouchEnd);
    }
    handleTouchEnd (e) {
        const {x, y} = getEventXY(e);
        const {top, left, bottom, right} = this.ref.getBoundingClientRect();
        if (x >= left && x <= right && y >= top && y <= bottom) {
            this.handleMouseEnter();
        }
    }
    addBackdropFromLibraryItem (item, shouldActivateTab = true) {
        const vmBackdrop = {
            name: item.name,
            md5: item.md5ext,
            rotationCenterX: item.rotationCenterX,
            rotationCenterY: item.rotationCenterY,
            bitmapResolution: item.bitmapResolution,
            skinId: null
        };
        this.handleNewBackdrop(vmBackdrop, shouldActivateTab);
    }
    handleClick () {
        this.props.onSelect(this.props.id);
    }
    handleNewBackdrop (backdrops_, shouldActivateTab = true) {
        const backdrops = Array.isArray(backdrops_) ? backdrops_ : [backdrops_];
        return Promise.all(backdrops.map(backdrop =>
            this.props.vm.addBackdrop(backdrop.md5, backdrop)
        )).then(() => {
            if (shouldActivateTab) {
                return this.props.onActivateTab(COSTUMES_TAB_INDEX);
            }
        });
    }
    // handleTuringData() {} TODO build fetching from Turing that has a loading screen?
    handleMap(e) {
        e.stopPropagation();

        dispatch(openMapModal());

        // this.props.onActivateTab(MAP_TAB_INDEX);
        return

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

        handleMapFromAPI(imageUrl)
        .then((data) => { // data will be the entire object returned by handleMapFromAPI
          const { buffer, fileType } = data;

          // Use buffer and fileType for map processing here
          const storage = this.props.vm.runtime.storage;
          var fileName = "Map "
          this.props.onShowMapLoad();
              costumeUpload(buffer, fileType, storage, vmCostumes => {
                  this.props.vm.setEditingTarget(this.props.id);
                  vmCostumes.forEach((costume, i) => {
                      costume.name = `${fileName}${i ? i + 1 : ''}`;
                  });
                  this.handleNewBackdrop(vmCostumes).then(() => {
                        this.props.onCloseMapLoad();
                        console.log("Successfully loaded map.")
                  });
              }, this.props.onCloseImporting);  
        })
        .catch((error) => {
          this.props.onCloseMapLoad();
          this.props.onShowMapError();
          console.error("Error fetching map:", error);
        });
      }
    handleBackdropUpload (e) {
        const storage = this.props.vm.runtime.storage;
        this.props.onShowImporting();
        handleFileUpload(e.target, (buffer, fileType, fileName, fileIndex, fileCount) => {
            costumeUpload(buffer, fileType, storage, vmCostumes => {
                this.props.vm.setEditingTarget(this.props.id);
                vmCostumes.forEach((costume, i) => {
                    costume.name = `${fileName}${i ? i + 1 : ''}`;
                });
                this.handleNewBackdrop(vmCostumes).then(() => {
                    if (fileIndex === fileCount - 1) {
                        this.props.onCloseImporting();
                    }
                });
            }, this.props.onCloseImporting);
        }, this.props.onCloseImporting);
    }
    handleSurpriseBackdrop (e) {
        e.stopPropagation(); // Prevent click from falling through to selecting stage.
        // @todo should this not add a backdrop you already have?
        const item = backdropLibraryContent[Math.floor(Math.random() * backdropLibraryContent.length)];
        this.addBackdropFromLibraryItem(item, false);
    }
    handleEmptyBackdrop (e) {
        e.stopPropagation(); // Prevent click from falling through to stage selector, select it manually below
        this.props.vm.setEditingTarget(this.props.id);
        this.handleNewBackdrop(emptyCostume(this.props.intl.formatMessage(sharedMessages.backdrop, {index: 1})));
    }
    handleFileUploadClick (e) {
        e.stopPropagation(); // Prevent click from selecting the stage, that is handled manually in backdrop upload
        this.fileInput.click();
    }
    handleMouseEnter () {
        this.props.dispatchSetHoveredSprite(this.props.id);
    }
    handleMouseLeave () {
        this.props.dispatchSetHoveredSprite(null);
    }
    handleDrop (dragInfo) {
        if (dragInfo.dragType === DragConstants.COSTUME) {
            this.props.vm.shareCostumeToTarget(dragInfo.index, this.props.id);
        } else if (dragInfo.dragType === DragConstants.SOUND) {
            this.props.vm.shareSoundToTarget(dragInfo.index, this.props.id);
        } else if (dragInfo.dragType === DragConstants.BACKPACK_COSTUME) {
            this.props.vm.addCostume(dragInfo.payload.body, {
                name: dragInfo.payload.name
            }, this.props.id);
        } else if (dragInfo.dragType === DragConstants.BACKPACK_SOUND) {
            this.props.vm.addSound({
                md5: dragInfo.payload.body,
                name: dragInfo.payload.name
            }, this.props.id);
        } else if (dragInfo.dragType === DragConstants.BACKPACK_CODE) {
            fetchCode(dragInfo.payload.bodyUrl)
                .then(blocks => {
                    this.props.vm.shareBlocksToTarget(blocks, this.props.id);
                    this.props.vm.refreshWorkspace();
                });
        }
    }
    setFileInput (input) {
        this.fileInput = input;
    }
    setRef (ref) {
        this.ref = ref;
    }
    render () {
        const componentProps = omit(this.props, [
            'asset', 'dispatchSetHoveredSprite', 'id', 'intl',
            'onActivateTab', 'onSelect', 'onShowImporting', 'onCloseImporting', 
            'onShowMapLoad', 'onCloseMapLoad', 'onShowMapError']);
        return (
            <DroppableThrottledStage
                componentRef={this.setRef}
                fileInputRef={this.setFileInput}
                onMapClick = {this.handleMap}
                onBackdropFileUpload={this.handleBackdropUpload}
                onBackdropFileUploadClick={this.handleFileUploadClick}
                onClick={this.handleClick}
                onDrop={this.handleDrop}
                onEmptyBackdropClick={this.handleEmptyBackdrop}
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
                onSurpriseBackdropClick={this.handleSurpriseBackdrop}
                {...componentProps}
            />
        );
    }
}
StageSelector.propTypes = {
    ...StageSelectorComponent.propTypes,
    id: PropTypes.string,
    intl: intlShape.isRequired,
    onCloseImporting: PropTypes.func,
    onSelect: PropTypes.func,
    onShowImporting: PropTypes.func,
    onShowMapLoad: PropTypes.func,
    onCloseMapLoad: PropTypes.func,
    onShowMapError: PropTypes.func
};

const mapStateToProps = (state, {asset, id}) => ({
    url: asset && asset.encodeDataURI(),
    vm: state.scratchGui.vm,
    receivedBlocks: state.scratchGui.hoveredTarget.receivedBlocks &&
            state.scratchGui.hoveredTarget.sprite === id,
    raised: state.scratchGui.blockDrag
});

const mapDispatchToProps = dispatch => ({
    onNewBackdropClick: e => {
        e.stopPropagation();
        dispatch(openBackdropLibrary());
    },
    onNewMapClick: e => {
        e.stopPropagation();
        dispatch(openMapModal());
    },
    onActivateTab: tabIndex => {
        dispatch(activateTab(tabIndex));
    },
    dispatchSetHoveredSprite: spriteId => {
        dispatch(setHoveredSprite(spriteId));
    },
    onCloseImporting: () => dispatch(closeAlertWithId('importingAsset')),
    onShowImporting: () => dispatch(showStandardAlert('importingAsset')),
    onShowMapLoad: () => dispatch(showStandardAlert('loadingMap')),
    onCloseMapLoad: () => dispatch(closeAlertWithId('loadingMap')),
    onShowMapError: () => dispatch(showStandardAlert('loadingMapError')),
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(StageSelector));
