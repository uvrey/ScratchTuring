import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import DragConstants from '../../lib/drag-constants.js';

import Box from '../box/box.jsx';
import SpriteSelectorItem from '../../containers/sprite-selector-item.jsx';
import SortableHOC from '../../lib/sortable-hoc.jsx';
import SortableAsset from '../asset-panel/sortable-asset.jsx';
import ThrottledPropertyHOC from '../../lib/throttled-property-hoc.jsx';

import styles from './sprite-selector.css';

// const ThrottledSpriteSelectorItem = ThrottledPropertyHOC('asset', 500)(SpriteSelectorItem);

const TuringList = function (props) {
    const {
        containerRef,
        editingTarget,
        draggingIndex,
        draggingType,
        hoveredTarget,
        onDeleteSprite,
        onDuplicateSprite,
        onExportSprite,
        onSelectSprite,
        onAddSortable,
        onRemoveSortable,
        ordering,
        raised,
        selectedId,
        items
    } = props;

    const isSpriteDrag = draggingType === DragConstants.SPRITE;

    return (
        <Box
            className={classNames(styles.scrollWrapper, {
                [styles.scrollWrapperDragging]: draggingType === DragConstants.BACKPACK_SPRITE
            })}
            componentRef={containerRef}
        >
            <Box
                className={styles.itemsWrapper}
            >
                {samples.map((sample, index) => {
                    return (
                        <SortableAsset
                            className={classNames(styles.spriteWrapper, {
                                [styles.placeholder]: isSpriteDrag && index === draggingIndex})}
                            index={isSpriteDrag ? ordering.indexOf(index) : index}
                            key={sprite.name}
                            onAddSortable={onAddSortable}
                            onRemoveSortable={onRemoveSortable}
                        >
                            {/* <ThrottledSpriteSelectorItem
                                asset={sprite.costume && sprite.costume.asset}
                                className={classNames(styles.sprite, {
                                    [styles.raised]: isRaised,
                                    [styles.receivedBlocks]: receivedBlocks
                                })}
                                dragPayload={sprite.id}
                                dragType={DragConstants.SPRITE}
                                id={sprite.id}
                                index={index}
                                key={sprite.id}
                                name={sprite.name}
                                selected={sprite.id === selectedId}
                                onClick={onSelectSprite}
                                onDeleteButtonClick={onDeleteSprite}
                                onDuplicateButtonClick={onDuplicateSprite}
                                onExportButtonClick={onExportSprite}
                            /> */}
                        </SortableAsset>
                    );
                })}
            </Box>
        </Box>
    );
};

TuringList.propTypes = {
    containerRef: PropTypes.func,
    draggingIndex: PropTypes.number,
    draggingType: PropTypes.oneOf(Object.keys(DragConstants)),
    editingTarget: PropTypes.string,
    hoveredTarget: PropTypes.shape({
        hoveredSprite: PropTypes.string,
        receivedBlocks: PropTypes.bool,
        sprite: PropTypes.string
    }),
    samples: PropTypes.array,
    data: PropTypes.object,
    onAddSortable: PropTypes.func,
    onDeleteSprite: PropTypes.func,
    onDuplicateSprite: PropTypes.func,
    onExportSprite: PropTypes.func,
    onRemoveSortable: PropTypes.func,
    onSelectSprite: PropTypes.func,
    ordering: PropTypes.arrayOf(PropTypes.number),
    raised: PropTypes.bool,
    selectedId: PropTypes.string
};

export default SortableHOC(TuringList);
