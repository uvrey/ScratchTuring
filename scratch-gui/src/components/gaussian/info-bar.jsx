import React from 'react';
import { ColorIndicator, GridNode } from '../styled-divs/styled-divs.jsx'; // Adjust the path as needed
import PropTypes from 'prop-types';
import styles from './gaussian.css'


const InfoBar = (props) => {
  return (
    <div className={styles.gridContainer}>
        SOME DATA HERE!
      {/* {["", "µ", "σ", "p", ""].map((value, index) => (
       <div key={index}>value? {value}</div>
      ))}
      {props.lines.map(({ id, name, mean, stdv, pValue, stroke }, index) => (
        <div key={index}>
          <div>
            <ColorIndicator color={stroke}></ColorIndicator>
            {name}
          </div>
          <div>
            <h3>{mean}</h3>
            <h3>{stdv}</h3>
            <h3>{pValue}</h3>
          </div>
        </div>
      ))} */}
    </div>
  );
};

InfoBar.propTypes = {
    lines: PropTypes.array, // list of chart data descriptions
};

export default InfoBar;
