import React, { useRef } from 'react';
import { Bar, Doughnut} from 'react-chartjs-2';
import styles from './turing-viz-panel.css';
import Box from '../box/box.jsx';

const HuePanel = (data) => {
  const chartRef = useRef(null);

  console.log("HUE PANEL RECEIVED THESE PROPS")
  console.log(data)

  console.log(typeof data)

  const CustomHue = (props) => { // TODO modify this so it returns rectangles with a particular colour
    // console.log(props.payload)
    const hue = props.payload.value % 360
    return (
      <foreignObject className={styles.labelWrapper} y={260} x={props.payload.tickCoord}>
        <div className={styles.colorSwatch} style={{ backgroundColor: hueToHex(hue) }} />
      </foreignObject>
    );
  };

  const chartData = {
    labels: data.data.map((item) => item.label),
    datasets: [
      {
        label: 'Hue Distribution',
        data: data.data.map((item) => item.value),
        backgroundColor: '#d41444',
        borderColor: '#d41444',
        borderWidth: 3,
        pointRadius: 0, // Hide data points
      },
    ],
  };

  const chartOptions = {
    scales: {
      xAxes: [{
        scaleLabel: {
          display: true,
          labelString: 'Hue',
        },
        ticks: {
          callback: (tickValue, index, values) => <CustomHue key={index} value={tickValue} />,
        },
      }],
      yAxes: [{
        ticks: {
          beginAtZero: true, // Ensure y-axis starts at 0
        },
        position: 'left', // Place y-axis on the left side
      }],
    },
  };

  return (
    <Box className={styles.hueDataChart}>
      <Doughnut ref={chartRef} data={chartData} options={chartOptions} />
      {console.log("WE NOW WANT TO PLOT SOMETHING :))")}
      {console.log(data.data)}
    </Box>
  );
};

export default HuePanel;
