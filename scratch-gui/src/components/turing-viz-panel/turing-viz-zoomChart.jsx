import React, { PureComponent } from 'react';
import {
    Label,
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Rectangle,
    ReferenceArea,
    BarChart,
    Bar,
    Cell,
    ResponsiveContainer,
    Legend
} from 'recharts';
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
    console.log("getting y axis domain..." + from + ", " + to)
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

        // console.log("INSIDE HUETOOLTIP CHART-> HELPFUL TOOLTIP?")
        // console.log(plot)
        // console.log(plot.helpfulTooltip) // This is using the initial state and won't change for some reason?

        if (plot.helpfulTooltip) {
            return (
                <div>
                    <div style={{ backgroundColor: "rgba(33,33,33,0.8)", padding: "0.3em", borderRadius: "0.3em" }}>
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
                    {/* <p>{`${label}: ${payload[0].value}`}</p> */}
                    <div style={{ backgroundColor: "rgba(33,33,33,0.8)", padding: "0.3em", borderRadius: "0.3em" }}>
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

export default class ZoomChart extends PureComponent {

    constructor({ props, data, plot, vizProps, stroke }) {
        super(props);
        this.state = initialState(data);
        this.data = data
        this.plot = plot
        this.vizProps = vizProps
        this.stroke = stroke
    }

    zoom(state) {
        let { refAreaLeft, refAreaRight } = state;
        const { data } = state;

        if (refAreaLeft === refAreaRight || refAreaRight === '') {
            this.setState(() => ({
                refAreaLeft: '',
                refAreaRight: '',
            }));
            return;
        }

        // xAxis domain
        if (refAreaLeft > refAreaRight) [refAreaLeft, refAreaRight] = [refAreaRight, refAreaLeft];

        // yAxis domain
        const [bottom, top] = getAxisYDomain(this.data, refAreaLeft, refAreaRight, 'value', 1);

        this.setState(() => ({
            refAreaLeft: '',
            refAreaRight: '',
            data: data.slice(),
            left: refAreaLeft,
            right: refAreaRight,
            bottom,
            top,
        }));
    }

    zoomOut() {
        const { data } = this.state;
        this.setState(() => ({
            data: data.slice(),
            refAreaLeft: '',
            refAreaRight: '',
            left: 'dataMin',
            right: 'dataMax',
            top: 'dataMax+1',
            bottom: 'dataMin',
        }));
    }

    render() {
        const { data, barIndex, left, right, refAreaLeft, refAreaRight, top, bottom } = this.state;
        return (
            <div className="highlight-bar-charts" style={{ userSelect: 'none', width: '100%' }}>
                <button type="button" className="btn update" onClick={this.zoomOut.bind(this)}>
                    Zoom Out
                </button>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                        width={800}
                        height={400}
                        style={{ marginTop: "1em" }}
                        data={data}
                        onMouseDown={(e) => this.setState({ refAreaLeft: e.activeLabel })}
                        onMouseMove={(e) => this.state.refAreaLeft && this.setState({ refAreaRight: e.activeLabel })}
                        onMouseUp={this.zoom.bind(this)}
                    >
                        {console.log("OUR DOMAIN IS... ")}
                        {console.log(left + ", " + right)}
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
                                 {console.log("OUR RANGE IS... ")}
                        {console.log(bottom + ", " + top)}

                        <YAxis allowDataOverflow
                            domain={[bottom, top]}
                            style={{ marginTop: '10px' }}
                            axisLine={{
                                stroke: "#ddd",
                                strokeWidth: 1,
                                strokeLinecap: "round", // Set rounded line ends
                            }}
                            tickLine={{ strokeWidth: 3 }}
                            label={{ value: 'Observations', angle: -90, position: 'insideLeft', textAnchor: 'bottom' }}
                            type="number"
                            yAxisId="1" />
                        <Tooltip content={<HueTooltip plot={this.plot} />} />
                        <Legend content={<HueLegend vizProps={this.vizProps} />} />
                        {console.log("Our data is: ")}
                        {console.log(data)}
                        <Bar
                            yAxisId="1"
                            type="monotone"
                            data={data} // Pass the entire data list
                            dataKey="value"
                            animationDuration={300}
                            style={{ strokeWidth: "2px" }}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={data[index].stroke} />
                            ))}
                        </Bar>

                        {/* <Bar yAxisId="1" type="monotone" dataKey="value" fill={data.stroke} animationDuration={300} style={{strokeWeight: "2px"}} activeBar={<Rectangle fill={hexToHue(data.stroke)} stroke={hexToHue(data.stroke)} />} /> */}
                        {refAreaLeft && refAreaRight ? (
                            <ReferenceArea yAxisId="1" x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} />
                        ) : null}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    }
}