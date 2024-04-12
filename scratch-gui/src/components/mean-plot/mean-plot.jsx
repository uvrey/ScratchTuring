import React from "react"
import PropTypes from 'prop-types';
import styles from './mean-plot.css'

import {
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  CartesianGrid,
  YAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts"

const MeanPlot = (props) => (
      <ResponsiveContainer>
        <BarChart width={730} height={300} data={props.data}>
          <XAxis
            allowDecimals={false}
            dataKey="input"
            type="number"
          />
          <YAxis allowDecimals={true} />
          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
          {props.lines.map((line) => (
            <Bar
              key={line.id}
              dataKey={line.id}
              type = "monotone"
              stroke={"#855CD6"}
              isAnimationActive={true}
              strokeWidth="1.5px"
            />
          ))}
          <Legend />
          <Tooltip />
        </BarChart>
      </ResponsiveContainer>
    )

MeanPlot.propTypes = {
    name: PropTypes.node, // Todo send name here
    lines: PropTypes.array, // list of chart data descriptions
    data: PropTypes.array
};

export default MeanPlot;

