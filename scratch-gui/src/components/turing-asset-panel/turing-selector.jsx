import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import Box from '../box/box.jsx';
import ActionMenu from '../action-menu/action-menu.jsx';
import SortableAsset from './sortable-asset.jsx';
import SortableHOC from '../../lib/sortable-hoc.jsx';
import DragConstants from '../../lib/drag-constants.js';
import timeIcon from './icon--time.svg';
import xIcon from './icon--x.svg';
import yIcon from './icon--y.svg';
import loudnessIcon from './icon--loudness.svg';
import sizeIcon from './icon--size.svg';
import erasorIcon from './icon--eraser.svg'
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

    function getIconFromType(type) {
      switch (type) {
          case 'TIME':
              return timeIcon;
          case 'SIZE':
              return sizeIcon;
          case 'LOUDNESS':
              return loudnessIcon;
          case 'X':
              return xIcon;
          case 'Y':
              return yIcon;
          default:
              return erasorIcon; // Return null for any other type
      }
  }

  const onClick = () => {
      console.log("button clicked")
  }
  
    newButtonSection = (
      <Box className={styles.newButtons}>
          <ActionMenu
              img={erasorIcon}
              // moreButtons={sampleButton}
              title={"Clear Samples"}
              onClick={onClick}
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
                {props.state.mode === "NUMERIC" ? (
                    <div key={index} className={styles.sampleContainer}>
                        <img src={getIconFromType(props.state.type)} className={styles.listItem} />
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
    state: PropTypes.object
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