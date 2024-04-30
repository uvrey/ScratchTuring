// import PropTypes from 'prop-types';
// import React from 'react';
// import classNames from 'classnames';
// import Box from '../box/box.jsx';
// import ActionMenu from '../action-menu/action-menu.jsx';
// import SortableAsset from './sortable-asset.jsx';
// import SortableHOC from '../../lib/sortable-hoc.jsx';
// import DragConstants from '../../lib/drag-constants.js';
// import timeIcon from './icon--time.svg';
import xIcon from './icon--x.svg';
import yIcon from './icon--y.svg';
import loudnessIcon from './icon--loudness.svg';
import sizeIcon from './icon--size.svg';
import erasorIcon from './icon--eraser.svg'
import octopusIcon from './icon--octopus.svg'
// import {defineMessages, FormattedMessage, intlShape} from 'react-intl';
// import styles from './turing-selector.css';
// import VM from 'scratch-vm';
// import {ContextMenuTrigger} from 'react-contextmenu';
// import {DangerousMenuItem, ContextMenu, MenuItem} from '../context-menu/context-menu.jsx';
// // import {DangerousMenuItem, ContextMenu, MenuItem} from '../context-menu/context-menu.jsx';

import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import TuringSelectorItem from '../../containers/turing-selector-item.jsx';
import Box from '../box/box.jsx';
import ActionMenu from '../action-menu/action-menu.jsx';
import SortableAsset from './turing-sortable-asset.jsx';
import SortableHOC from '../../lib/sortable-hoc.jsx';
import DragConstants from '../../lib/drag-constants';
import VM from 'scratch-vm'

import styles from './turing-selector.css';


var SAMPLE_COUNTS = {}

const TuringSelector = props => {
    const {
        buttons,
        containerRef,
        dragType,
        isRtl,
        items,
        selectedItemIndex,
        draggingIndex,
        draggingType,
        ordering,
        onAddSortable,
        onRemoveSortable,
        onDeleteClick,
        onDuplicateClick,
        onExportClick,
        onItemClick
    } = props;

    const isRelevantDrag = draggingType === dragType;
    let newButtonSection = null;

    function onClearSamples(targetName) {
        props.vm.runtime.emit('CLEAR_SAMPLES', targetName)
    }

    function getKey(sample) {
        if (SAMPLE_COUNTS[sample] == undefined) {
            SAMPLE_COUNTS[sample] = 0
            return sample+''
        } else {
            SAMPLE_COUNTS[sample] = SAMPLE_COUNTS[sample] + 1
            return sample + "_" + SAMPLE_COUNTS[sample]
        }
    }

    newButtonSection = (
        <Box className={styles.newButtons}>
            <ActionMenu
                img={erasorIcon}
                title={"Clear Samples"}
                onClick={() => onClearSamples(props.vm.editingTarget.getName())}
            />
        </Box>
    );

    return (
        <Box
            className={styles.wrapper}
            componentRef={containerRef}
        >
            {/* <h2>Inside turing selector we want to display... {props.activeModel}</h2> */}
            <Box className={styles.listArea}>
                {props.items.map((sample, index) => (
                    <SortableAsset
                        id={sample}
                        index={isRelevantDrag ? ordering.indexOf(index) : index}
                        key={getKey(sample)}
                        onAddSortable={onAddSortable}
                        onRemoveSortable={onRemoveSortable}
                    >
                        <TuringSelectorItem
                            className={classNames(styles.listItem, {
                                [styles.placeholder]: isRelevantDrag && index === draggingIndex
                            })}
                            // dragPayload={item.dragPayload}
                            dragType={dragType}
                            id={index}
                            index={index}
                            name={sample => typeof sample !== 'string' ? sample.toString() : sample}
                            number={index + 1}
                            selected={index === selectedItemIndex}
                            onClick={onItemClick}
                            onDeleteButtonClick={onDeleteClick}
                            data={props.data}
                            sample={sample}
                            randomVarName={props.data.dataSpecs.randomVars[index]}
                        />
                    </SortableAsset>
                ))}
            </Box>
            {newButtonSection}
        </Box>
    );
};

TuringSelector.propTypes = {
    buttons: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.string.isRequired,
        img: PropTypes.string.isRequired,
        onClick: PropTypes.func
    })),
    containerRef: PropTypes.func,
    dragType: PropTypes.oneOf(Object.keys(DragConstants)),
    draggingIndex: PropTypes.number,
    draggingType: PropTypes.oneOf(Object.keys(DragConstants)),
    isRtl: PropTypes.bool,
    data: PropTypes.object,
    // samples: PropTypes.array,
    vm: PropTypes.instanceOf(VM),
    onAddSortable: PropTypes.func,
    onDeleteClick: PropTypes.func,
    onDuplicateClick: PropTypes.func,
    onExportClick: PropTypes.func,
    onItemClick: PropTypes.func.isRequired,
    onRemoveSortable: PropTypes.func,
    ordering: PropTypes.arrayOf(PropTypes.number),
    selectedItemIndex: PropTypes.number,
    items: PropTypes.array,
    activeModels: PropTypes.array
};

export default SortableHOC(TuringSelector); // make sortable at some point? TODO


{/* <SortableAsset
id={sample.name}
index={isRelevantDrag ? ordering.indexOf(index) : index}
key={sample.name}
onAddSortable={onAddSortable}
onRemoveSortable={onRemoveSortable}
>
<TuringSelectorItem
    asset={sample.asset}
    className={classNames(styles.listItem, {
        [styles.placeholder]: isRelevantDrag && index === draggingIndex
    })}
    costumeURL={sample.url}
    details={sample.details}
    dragPayload={sample.dragPayload}
    dragType={dragType}
    id={index}
    index={index}
    name={sample.name}
    number={index + 1 /* 1-indexed */}
//     selected={index === selectedItemIndex}
//     onClick={onItemClick}
//     onDeleteButtonClick={onDeleteClick}
// />
// </SortableAsset> */}