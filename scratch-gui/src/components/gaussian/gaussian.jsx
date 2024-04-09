import React from "react"
import classNames from 'classnames';
import PropTypes from 'prop-types';

import {
  LineChart,
  Line,
  XAxis,
  CartesianGrid,
  YAxis,
  ResponsiveContainer,
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
        </LineChart>
      </ResponsiveContainer>
    )

Gaussian.propTypes = {
    name: PropTypes.node, // Todo send name here
    lines: PropTypes.array, // list of chart data descriptions
    data: PropTypes.object
};

export default Gaussian;

