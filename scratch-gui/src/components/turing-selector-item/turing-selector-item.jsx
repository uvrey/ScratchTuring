import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
// import DeleteButton from '../delete-button/delete-button.jsx';
import styles from './turing-selector-item.css';
import timerIcon from '../action-menu/icon--timer.svg'
import DeleteButton from '../delete-button/delete-button.jsx';
import { ContextMenuTrigger } from 'react-contextmenu';
import { DangerousMenuItem, ContextMenu, MenuItem } from '../context-menu/context-menu.jsx';
import { FormattedMessage } from 'react-intl';

import xIcon from './icon--x.svg';
import yIcon from './icon--y.svg';
import loudnessIcon from './icon--loudness.svg';
import sizeIcon from './icon--size.svg';
import erasorIcon from './icon--eraser.svg'
import timeIcon from './icon--time.svg'
import octopusIcon from './icon--purpleOctopus.svg'
import surpriseIcon from '../action-menu/icon--graySurprise.svg'

// // react-contextmenu requires unique id to match trigger and context menu
let contextMenuId = 0;

function getIconFromType(type) {
  switch (type) {
    case 'TIME TAKEN':
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
      return surpriseIcon; // Return null for any other type
  }
}
const TuringSelectorItem = props => {
  return (
    <ContextMenuTrigger
      attributes={{
        className: classNames(props.className, styles.spriteSelectorItem, {
          [styles.isSelected]: props.selected
        }),
        onClick: props.onClick,
        onMouseEnter: props.onMouseEnter,
        onMouseLeave: props.onMouseLeave,
        onMouseDown: props.onMouseDown,
        onTouchStart: props.onMouseDown
      }}
      disable={props.preventContextMenu}
      id={`${props.sample}-contextMenu`}
      ref={props.componentRef}
    >
      <div className={styles.number}>{props.number}</div> {/* Display number once */}
      <div className={styles.spriteImageOuter}>
        <div className={styles.spriteImageInner}>
          {console.log("Inside turing selector, we have... ")}
          {console.log(props.data)}
          {console.log("random varname?" + props.randomVarName)}
          {/* Display swatch or icon */}
          {props.randomVarName === 'COLOR' ? (
            <div className={styles.colorSwatch} style={{ backgroundColor: props.sample }}>
            </div>
          ) : (
            <img
              className={styles.spriteImage}
              draggable={false}
              src={getIconFromType(props.randomVarName)}
            />
          )}
        </div>
      </div>
      <div className={styles.spriteInfo}>
        <div className={styles.spriteName}>{props.sample} {props.data.user_model.unit}</div>
      </div>
    </ContextMenuTrigger>
  );
}

TuringSelectorItem.propTypes = {
  state: PropTypes.object,
  className: PropTypes.string,
  componentRef: PropTypes.func,
  costumeURL: PropTypes.string,
  details: PropTypes.string,
  name: PropTypes.string.isRequired,
  number: PropTypes.number,
  onClick: PropTypes.func,
  onDeleteButtonClick: PropTypes.func,
  // onDuplicateButtonClick: PropTypes.func,
  // onExportButtonClick: PropTypes.func,
  onMouseDown: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  preventContextMenu: PropTypes.bool,
  selected: PropTypes.bool.isRequired,
  data: PropTypes.object.isRequired,
  sample: PropTypes.node.isRequired,
  randomVarName: PropTypes.string.isRequired
};

export default TuringSelectorItem;
