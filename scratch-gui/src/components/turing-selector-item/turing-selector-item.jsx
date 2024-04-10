import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
// import DeleteButton from '../delete-button/delete-button.jsx';
import styles from './turing-selector-item.css';
import timerIcon from '../action-menu/icon--timer.svg'
// import {ContextMenuTrigger} from 'react-contextmenu';
// import {DangerousMenuItem, ContextMenu, MenuItem} from '../context-menu/context-menu.jsx';
// import {FormattedMessage} from 'react-intl';

// // react-contextmenu requires unique id to match trigger and context menu
// let contextMenuId = 0;

const TuringSelectorItem = props => {
    return (
    // <ContextMenuTrigger
    //     attributes={{
    //         className: classNames(props.className, styles.turingSelectorItem, {
    //             [styles.isSelected]: props.selected
    //         }),
    //         onClick: props.onClick,
    //         onMouseEnter: props.onMouseEnter,
    //         onMouseLeave: props.onMouseLeave,
    //         onMouseDown: props.onMouseDown,
    //         onTouchStart: props.onMouseDown
    //     }}
    //     disable={props.preventContextMenu}
    //     id={`${props.name}-${contextMenuId}`}
    //     ref={props.componentRef}
    // >
        // {typeof props.number === 'undefined' ? null : (
        //     <div className={styles.number}>{props.number}</div>
        // )}
        // {props.costumeURL ? (
        //     <div className={styles.sampleImageOuter}>
        //         <div className={styles.sampleImageInner}>
        //             <img
        //                 className={styles.sampleImage}
        //                 draggable={false}
        //                 src={props.costumeURL}
        //             />
        //         </div>
        //     </div>
        // ) : null}
        // <div key={index} className="sample-container">
        // <img src={timestampIcon} className={styles.listItem} />
        // <p className={styles.sampleLabel}> {sample}</p>
        // </div>
        <Box className={styles.sampleInfo}>
            {props.mode === "TIME_BASED" ? (
                <div key={index}>
                <img src={timerIcon} className={styles.listItem} />
                <div className={styles.sampleName}>{props.sample}</div>
                </div>
            ) : (
                <div key={index}>
                <img src={compassIcon} className={styles.listItem} />
                <div className={styles.sampleName}>{props.sample}</div>
                </div>
            )}
        </Box>
        // {(props.selected && props.onDeleteButtonClick) ? (
        //     <DeleteButton
        //         className={styles.deleteButton}
        //         onClick={props.onDeleteButtonClick}
        //     />
        // ) : null }
        // {props.onDeleteButtonClick ? (
        //     <ContextMenu id={`${props.name}-${contextMenuId++}`}>
        //         {props.onDeleteButtonClick ? (
        //             <DangerousMenuItem onClick={props.onDeleteButtonClick}>
        //                 <FormattedMessage
        //                     defaultMessage="delete"
        //                     description="Menu item to delete in the right click menu"
        //                     id="gui.turingSelectorItem.contextMenuDelete"
        //                 />
        //             </DangerousMenuItem>
        //         ) : null }
        //     </ContextMenu>
        // ) : null}
    // </ContextMenuTrigger>
        );
    }

TuringSelectorItem.propTypes = {
    sample: PropTypes.node,
    mode: PropTypes.string,
};

export default TuringSelectorItem;
