import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import Box from '../box/box.jsx';
import ActionMenu from '../action-menu/action-menu.jsx';
import SortableAsset from './sortable-asset.jsx';
import SortableHOC from '../../lib/sortable-hoc.jsx';
import DragConstants from '../../lib/drag-constants.js';
import timestampIcon from '../action-menu/icon--timestamp.svg';
import compassIcon from '../action-menu/icon--compass.svg';


import styles from './turing-selector.css';
import { FormattedMessage } from 'react-intl';

const TuringSelector = props => {
    const {
        buttons,
        containerRef,
        dragType,
        samples,
        selectedSampleIndex,
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

    return (
        <Box
          className={styles.wrapper}
          componentRef={containerRef}
        >
          <Box className={styles.listArea}>
            <Box className={styles.samplesHeader}>
              <FormattedMessage
                defaultMessage="Samples"
                description="samples"
                id="gui.turingSelector.samples"
              />
            </Box>
            {props.samples.map((sample, index) => (
                <Box className={styles.sampleInfo}>
                {props.mode === "TIME_BASED" ? (
                    <div key={index} className="sample-container">
                        <img src={timestampIcon} className={styles.listItem} />
                        <div className={styles.sampleInfo}>{sample}</div>
                    </div>
                ) : (
                    <div key={index} className="sample-container">
                    <div className={styles.colorSwatch} style={{ backgroundColor: sample }}>
                    <div className="square-rectangle"></div>
                    </div>
                    <div className={styles.sampleInfo}>{sample}</div>
                    </div>
                )}
                </Box>
            ))}
          </Box>
        </Box>
      );
      
};

TuringSelector.propTypes = {
    samples: PropTypes.array,
    mode: PropTypes.string
};

export default TuringSelector; // make sortable at some point? TODO


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