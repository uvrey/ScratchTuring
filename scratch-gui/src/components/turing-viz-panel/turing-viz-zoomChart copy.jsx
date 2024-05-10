import React, { PureComponent, useState } from 'react';
import {
    Label,
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ReferenceArea,
    BarChart,
    Bar,
    ResponsiveContainer,
    ScatterChart, Scatter
} from 'recharts';
import styles from './turing-viz-panel.css';
import Color from './color.js'
// import CustomDot from "./CustomDot";
import getClickedPoint from "./turing-getClickedPoint.jsx";


const hueToHex = (hue) => {
    const hsv = { h: hue, s: 80, v: 80 }
    return Color.rgbToHex(Color.hsvToRgb(hsv))
}

const hexToHue = (hex) => {
    const hsv = Color.rgbToHsv(Color.hexToRgb(hex))
    return hueToHex(hsv.h)
}


const CustomHue = (props) => {
    const hue = props.payload.value % 360;
    // Calculate the corresponding color in hex format
    const color = hueToHex(hue);

    console.log(props.payload)

    // Use an SVG rect instead of foreignObject
    return (
        <rect
            className={styles.hueBox}
            x={props.payload.tickCoord}
            y={props.payload.offset}
            width="1.2em"
            height="1.2em"
            fill={color} // Set fill color to calculated hex
        />
    );
};



const data = [
    { x: 50, y: 200 },
    { x: 70, y: 100 },
    { x: 170, y: 300 },
    { x: 140, y: 250 },
    { x: 150, y: 400 },
    { x: 110, y: 280 }
];
const MIN_ZOOM = 5; // adjust based on your data
const DEFAULT_ZOOM = { x1: null, y1: null, x2: null, y2: null };

// data currently on the plot
const [filteredData, setFilteredData] = useState(data);
// selected data point
const [selectedPoint, setSelectedPoint] = useState(data[1]);
// zoom coordinates
const [zoomArea, setZoomArea] = useState(DEFAULT_ZOOM);
// flag if currently zooming (press and drag)
const [isZooming, setIsZooming] = useState(false);
// flag if zoomed in
const isZoomed = filteredData?.length !== data?.length;

// flag to show the zooming area (ReferenceArea)
const showZoomBox =
    isZooming &&
    !(Math.abs(zoomArea.x1 - zoomArea.x2) < MIN_ZOOM) &&
    !(Math.abs(zoomArea.y1 - zoomArea.y2) < MIN_ZOOM);

export default class SZoomChart extends PureComponent {
    // reset the states on zoom out
    handleZoomOut() {
        setFilteredData(data);
        setZoomArea(DEFAULT_ZOOM);
    }

    /**
     * Two possible events:
     * 1. Clicking on a dot(data point) to select
     * 2. Clicking on the plot to start zooming
     */
    handleMouseDown(e) {
        setIsZooming(true);
        const { chartX, chartY, xValue, yValue } = e || {};
        const clickedPoint = getClickedPoint(chartX, chartY, filteredData);

        if (clickedPoint) {
            setSelectedPoint(clickedPoint);
        } else {
            // console.log("zoom start");
            setZoomArea({ x1: xValue, y1: yValue, x2: xValue, y2: yValue });
        }
    }

    // Update zoom end coordinates
    handleMouseMove(e) {
        if (isZooming) {
            // console.log("zoom selecting");
            setZoomArea((prev) => ({ ...prev, x2: e?.xValue, y2: e?.yValue }));
        }
    }

    // When zooming stops, update with filtered data points
    // Ignore if not enough zoom
    handleMouseUp(e) {
        if (isZooming) {
            setIsZooming(false);
            let { x1, y1, x2, y2 } = zoomArea;

            // ensure x1 <= x2 and y1 <= y2
            if (x1 > x2) [x1, x2] = [x2, x1];
            if (y1 > y2) [y1, y2] = [y2, y1];

            if (x2 - x1 < MIN_ZOOM || y2 - y1 < MIN_ZOOM) {
                // console.log("zoom cancel");
            } else {
                // console.log("zoom stop");
                const dataPointsInRange = filteredData.filter(
                    (d) => d.x >= x1 && d.x <= x2 && d.y >= y1 && d.y <= y2
                );
                setFilteredData(dataPointsInRange);
                setZoomArea(DEFAULT_ZOOM);
            }
        }
    }

    render() {
        return (
            <div className="plot-container" >
                {isZoomed && <button onClick={handleZoomOut}>Zoom Out</button>}
                <ScatterChart
                    width={400}
                    height={400}
                    margin={{ top: 50 }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                >
                    <XAxis
                        type="number"
                        dataKey="x"
                        domain={["dataMin - 20", "dataMax + 20"]}
                    />
                    <YAxis
                        type="number"
                        dataKey="y"
                        domain={["dataMin - 50", "dataMax + 50"]}
                    />
                    {showZoomBox && (
                        <ReferenceArea
                            x1={zoomArea?.x1}
                            x2={zoomArea?.x2}
                            y1={zoomArea?.y1}
                            y2={zoomArea?.y2}
                        />
                    )}
                    <Scatter
                        data={filteredData}
                        shape={<CustomDot selectedPoint={selectedPoint} />}
                    />
                </ScatterChart>
            </div >
        );
    }
}
