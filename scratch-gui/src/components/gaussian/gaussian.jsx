import React from "react"
import PropTypes from 'prop-types';
import InfoBar from "./info-bar.jsx";
import styles from './gaussian.css'

import {
  LineChart,
  Line,
  XAxis,
  CartesianGrid,
  YAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts"

const Gaussian = (props) => (
      <ResponsiveContainer>
        <LineChart width={730} height={300} data={props.data}>
          <XAxis
            allowDecimals={false}
            dataKey="input"
            type="number"
          />
          <YAxis allowDecimals={true} />
          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
          {props.lines.map((line) => (
            <Line
              key={line.id}
              dataKey={line.id}
              type = "monotone"
              stroke={line.stroke}
              dot={false}
              isAnimationActive={true}
              strokeWidth="1.5px"
            />
          ))}
          <Legend />
          <Tooltip />
        </LineChart>
        {/* <InfoBar lines={props.lines}/> TODO fix this information bar*/}
      </ResponsiveContainer>
    )

Gaussian.propTypes = {
    name: PropTypes.node, // Todo send name here
    lines: PropTypes.array, // list of chart data descriptions
    data: PropTypes.object
};

export default Gaussian;

