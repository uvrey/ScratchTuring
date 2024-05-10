import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell, ReferenceArea, ResponsiveContainer } from 'recharts';
import styles from './turing-viz-panel.css';
import Color from './color.js'


const hueToHex = (hue) => {
    const hsv = { h: hue, s: 80, v: 80 }
    return Color.rgbToHex(Color.hsvToRgb(hsv))
}

const CustomHue = (props) => {
    const hue = props.payload.value % 360;
    const color = hueToHex(hue);
    return (
        <rect
            className={styles.hueBox}
            x={props.x}
            y={props.y}
            width="1.2em"
            height="1.2em"
            fill={color} // Set fill color to calculated hex
        />
    );
};

const getAxisYDomain = (data, from, to, ref, offset) => {
    const refData = data.slice(from - 1, to);
    let [bottom, top] = [refData[0][ref], refData[0][ref]];
    refData.forEach((d) => {
        if (d[ref] > top) top = d[ref];
        if (d[ref] < bottom) bottom = d[ref];
    });
    return [(bottom | 0), (top | 0) + offset];
};

const hexToHue = (hex) => {
    console.log("doing hex to hue with: " + hex)
    const hsv = Color.rgbToHsv(Color.hexToRgb(hex))
    return hueToHex(hsv.h)
}


const initialState = (data) => {
    return {
        data: data,
        left: 'dataMin',
        right: 'dataMax',
        refAreaLeft: '',
        refAreaRight: '',
        top: 'dataMax+1',
        bottom: 'dataMin',
        animation: true,
        zoomed: false,
    };
}

const formatId = (modelName, label) => {
    return modelName + "_" + label
}

const HueLegend = ({ vizProps }) => (
    <div style={{ justifyContent: "center" }}>
        <div style={{ marginTop: "0.5em" }}>
            <label htmlFor={formatId(vizProps.activeModel, "helpfulTooltipHue")} className={styles.checkboxLabel}>
                <input
                    id={formatId(vizProps.activeModel, "helpfulTooltipHue")}
                    type="checkbox"
                    className={styles.chartCheckbox}
                    onChange={() => vizProps.updateChart(vizProps.activeModel, 'tooltip')}
                />
                Helpful tooltip
            </label>
        </div>
    </div>
);

const HueTooltip = ({ active, payload, label, plot }) => {
    const index = Number(label)
    if (active && payload && payload.length) { // Check if tooltip is active and has data
        const freq = payload[0].payload.value
        if (plot.helpfulTooltip) {
            return (
                <div>
                    <div style={{ backgroundColor: "rgba(33,33,33,0.5)", padding: "0.3em", borderRadius: "0.3em" }}>
                        {plot.hues.hueFamilies[index].map((hex, index) => (
                            <div className={styles.hueSwatch} style={{ color: hex, backgroundColor: hex, stroke: "#eee", strokeWeight: "3px", marginBottom: "0.4em", borderRadius: "0.3em", padding: "0.5em" }}>{hex}</div>
                        ))}
                        <div className={styles.dataRow}>
                            <div className={styles.hueBox} style={{ backgroundColor: hueToHex(label), stroke: "#eee", strokeWeight: "3px", borderRadius: "0.3em", width: "1.5em", height: "1.5em", padding: "0.5em", marginRight: freq > 0 ? '3px' : '0px' }} />
                            {freq > 0 ? (<b style={{ color: "white" }}> x {freq}</b>) : (null)}
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div>
                    <div style={{ backgroundColor: "rgba(33,33,33,0.5)", padding: "0.3em", borderRadius: "0.3em" }}>
                        <div className={styles.dataRow}>
                            <div className={styles.hueBox} style={{ backgroundColor: hueToHex(label), stroke: "#eee", strokeWeight: "3px", borderRadius: "0.3em", width: "1.5em", height: "1.5em", padding: "0.5em", marginRight: freq > 0 ? '3px' : '0px' }} />
                            {freq > 0 ? (<b style={{ color: "white" }}> x {freq}</b>) : (null)}
                        </div>
                    </div>
                </div>
            );
        }
    }
    return null;
};

const ZoomChart = ({ data, plot, vizProps, stroke }) => {
    const [state, setState] = useState(initialState(data));

    const zoom = () => {
        let { refAreaLeft, refAreaRight } = state;

        if (refAreaLeft === refAreaRight || refAreaRight === '') {
            setState({
                ...state,
                refAreaLeft: '',
                refAreaRight: '',
            });
            return;
        }

        if (refAreaLeft > refAreaRight) [refAreaLeft, refAreaRight] = [refAreaRight, refAreaLeft];

        const [bottom, top] = getAxisYDomain(data, refAreaLeft, refAreaRight, 'value', 1);

        setState({
            ...state,
            refAreaLeft: '',
            refAreaRight: '',
            data: data.slice(),
            left: refAreaLeft,
            right: refAreaRight,
            bottom,
            top,
            zoomed: true,
        });
    };

    const zoomOut = () => {
        setState({
            ...state,
            data: data.slice(),
            refAreaLeft: '',
            refAreaRight: '',
            left: 'dataMin',
            right: 'dataMax',
            top: 'dataMax+1',
            bottom: 'dataMin',
            zoomed: false,
        });
    };

    const { left, right, refAreaLeft, refAreaRight, top, bottom, zoomed } = state;

    return (
        <div className={styles.chartBox} style={{ userSelect: 'none', width: '100%', marginLeft: "-1em"}}>
            <ResponsiveContainer width="100%" height={400}>
                {zoomed ? (
                    <button
                        type="button"
                        className={styles.zoomButton}
                        style={{ backgroundColor: "#9966FF", fontWeight: 600 }}
                        onClick={zoomOut}>
                        Zoom Out
                    </button>
                ) : (
                    <button
                        type="button"
                        className={styles.zoomButton}
                        style={{ backgroundColor: "#ccc", fontWeight: 600 }}
                        disabled>
                        Zoom Out
                    </button>
                )}
                <BarChart
                    width={800}
                    height={400}
                    style={{ marginTop: "1em" }}
                    data={data}
                    onMouseDown={(e) => setState({ ...state, refAreaLeft: e.activeLabel })}
                    onMouseMove={(e) => state.refAreaLeft && setState({ ...state, refAreaRight: e.activeLabel })}
                    onMouseUp={zoom}
                >
                    <XAxis allowDataOverflow
                        dataKey="hue"
                        domain={[left, right]}
                        tick={<CustomHue />}
                        tickCount={360}
                        visibleTickCount={360}
                        interval={0}
                        offset={0}
                        minTickGap={0}
                        axisLine={{
                            stroke: "#ddd",
                            strokeWidth: 3,
                            strokeLinecap: "round",
                        }}
                        tickLine={false}
                        type="number" />
                    <YAxis allowDataOverflow
                        domain={[bottom, top]}
                        style={{ marginTop: '10px' }}
                        axisLine={{
                            stroke: "#ddd",
                            strokeWidth: 1,
                            strokeLinecap: "round",
                        }}
                        tickLine={{ strokeWidth: 3 }}
                        label={{ value: 'Observations', angle: -90, position: 'insideLeft', textAnchor: 'bottom' }}
                        type="number"
                        yAxisId="1" />
                    <Tooltip content={<HueTooltip plot={plot} />} />
                    <Legend content={<HueLegend vizProps={vizProps} style={{marginTop: "-1em"}} />} />
                    <Bar
                        yAxisId="1"
                        type="monotone"
                        dataKey="value"
                        animationDuration={300}
                        style={{ strokeWidth: "2px" }}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={data[index].stroke} />
                        ))}
                    </Bar>
                    {refAreaLeft && refAreaRight ? (
                        <ReferenceArea yAxisId="1" x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} />
                    ) : null}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ZoomChart;
