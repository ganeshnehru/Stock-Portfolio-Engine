import { Line } from 'react-chartjs-2';
import {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TooltipYAlignment,
    TooltipItem
} from 'chart.js';
import { LineGraphData } from '../../types/types';

// references: https://codesandbox.io/s/react-chartjs-2-line-chart-example-5z3ss?file=/src/App.js:92-496
// https://react-chartjs-2.js.org/examples/line-chart
// register Chart.js plugins/dependencies
Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export enum LineGraphDimensions {
    LINE_GRAPH_WIDTH = 600,
    LINE_GRAPH_HEIGHT = 250
}

export interface LineGraphProps {
    strategy_name: string;
    lineGraphData: LineGraphData;
    maxValue: number;
}

const LineGraphHistory = (props: LineGraphProps) => {
    // line graph options
    // https://stackoverflow.com/questions/47836842/dollar-sign-on-y-axis-with-chartjs
    const options = {
        scales: {
            y: {
                // reference: https://www.chartjs.org/docs/latest/axes/
                // add buffer to max value to give space for tooltip, max value on yaxis
                suggestedMax: props.maxValue + 50,
                ticks: {
                    stepSize: 50,
                    callback: (value: string | number) => {
                        return '$' + value;
                    }
                }
            }
        },
        plugins: {
            tooltip: {
                // update y position of tooltip
                // reference: https://www.chartjs.org/docs/latest/configuration/tooltip.html#tooltip-alignment
                yAlign: 'bottom' as TooltipYAlignment,
                // show tooltip when line is hovered instead of at point
                intersect: false,
                callbacks: {
                    label: (tooltipItems: TooltipItem<'line'>) => {
                        // show label and associated value
                        return `${tooltipItems.dataset.label}: $${tooltipItems.formattedValue}`;
                    }
                }
            }
        }
    };
    return (
        <div className="lineGraphHistory">
            <h5> {props.strategy_name} </h5>
            <Line
                data={props.lineGraphData}
                width={LineGraphDimensions.LINE_GRAPH_WIDTH}
                height={LineGraphDimensions.LINE_GRAPH_HEIGHT}
                options={options}
            />
        </div>
    );
};

export default LineGraphHistory;
