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
import drumIcon from '../action-menu/icon--drum.svg'
import Color from '../turing-viz-panel/color.js'

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
    case 'RHYTHM':
      return drumIcon;
    default:
      return surpriseIcon;
  }
}

const hueToHex = (hue) => {
  const hsv = { h: hue, s: 100, v: 100 }
  return Color.rgbToHex(Color.hsvToRgb(hsv))
}

const hexToHue = (hex) => {
  const hsv = Color.rgbToHsv(Color.hexToRgb(hex))
  return hueToHex(hsv.h)
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
          {props.randomVarName === 'COLOR' ? (
            <div className={styles.colorSwatch} style={{ backgroundColor: props.sample }} />
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
        {console.log(props.sample)}
        {props.randomVarName === 'RHYTHM' ? (
          (<div
            className={styles.spriteName}
          >
            {props.rhythmSample}
          </div>)
        ) : (
          <div
            className={styles.spriteName}
            style={props.randomVarName === "COLOR" ? { backgroundColor: hexToHue(props.sample), color: hexToHue(props.sample) } : null}
          >
            {props.sample}{props.data.unit}
          </div>
        )}
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
