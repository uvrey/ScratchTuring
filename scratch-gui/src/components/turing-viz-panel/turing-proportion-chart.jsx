import React, { useRef } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import styles from './turing-viz-panel.css';
import Box from '../box/box.jsx';

const ProportionPanel = (data) => {
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


    function colorize(opaque, hover, ctx) {
        const v = ctx.parsed;
        const c = v < -50 ? '#D60000'
            : v < 0 ? '#F46300'
                : v < 50 ? '#0358B6'
                    : '#44DE28';

        const opacity = hover ? 1 - Math.abs(v / 150) - 0.2 : 1 - Math.abs(v / 150);

        return opaque ? c : Utils.transparentize(c, opacity);
    }

    function hoverColorize(ctx) {
        return colorize(false, true, ctx);
    }

    const config = {
        type: 'pie',
        data: data,
        options: {
            plugins: {
                legend: false,
                tooltip: false,
            },
            elements: {
                arc: {
                    backgroundColor: colorize.bind(null, false, false),
                    hoverBackgroundColor: hoverColorize
                }
            }
        }
    };

    return (
        <Box className={styles.hueDataChart}>
            <Doughnut ref={chartRef} data={chartData} options={config} />
        </Box>
    );
};

export default ProportionPanel;










