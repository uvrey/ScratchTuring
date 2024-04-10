import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import Box from '../box/box.jsx';
import ActionMenu from '../action-menu/action-menu.jsx';
import SortableAsset from './sortable-asset.jsx';
import SortableHOC from '../../lib/sortable-hoc.jsx';
import DragConstants from '../../lib/drag-constants.js';
import timestampIcon from '../action-menu/icon--timer.svg';
import compassIcon from '../action-menu/icon--compass.svg';
import erasorIcon from '../action-menu/icon--eraser.svg'
import {defineMessages, FormattedMessage, intlShape} from 'react-intl';
import styles from './turing-selector.css';

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

    const selectorMessages = defineMessages({
            clearSampleMessage: {
            id: 'gui.turingSelector.clearSample',
            defaultMessage: 'Clear Samples'
          }
      });

    // let sampleButton = (
    //                 [{
    //                   title: "Clear Samples",
    //                   img: erasorIcon,
    //                   // onClick: handleClearSamples(),
    //                 }]
    //           )

    newButtonSection = (
      <Box className={styles.newButtons}>
          <ActionMenu
              img={erasorIcon}
              // moreButtons={sampleButton}
              title={"Clear Samples"}
              // onClick={onClick}
          />
      </Box>
  );

    return (
        <Box
          className={styles.wrapper}
          componentRef={containerRef}
        >
          <Box className={styles.listArea}>
            {props.samples.map((sample, index) => (
                <Box className={styles.sampleInfo}>
                {props.mode === "TIME_BASED" ? (
                    <div key={index} className={styles.sampleContainer}>
                        <img src={timestampIcon} className={styles.listItem} />
                        <div className={styles.sampleLabel}>{sample}</div>
                    </div>
                ) : (
                    <div key={index} className={styles.sampleContainer}>
                      <div className={styles.colorSwatch} style={{ backgroundColor: sample }}>
                      <div className="square-rectangle"></div>
                      </div>
                      <div className={styles.sampleLabel}>{sample}</div>
                    </div>
                )}
                </Box>
            ))}
          </Box>
          {newButtonSection}
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