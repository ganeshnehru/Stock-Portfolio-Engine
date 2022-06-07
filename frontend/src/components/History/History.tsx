import React, { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import randomColor from 'randomcolor';
import { RootState } from '../../store/store';
import {
    HistoryData,
    InvestmentStrategyHistory,
    LineGraphData,
    LineGraphDatasetData,
    User
} from '../../types/types';
import LineGraphHistory from '../LineGraphHistory/LineGraphHistory';

const History = () => {
    // initial api response for history
    const [historyData, setHistoryData] = useState<
        Array<InvestmentStrategyHistory>
    >([]);

    const [needApiRequest, setNeedApiRequest] = useState<boolean>(false);

    const [maxDataValue, setMaxDataValue] = useState<number>(0);

    // update history with line graph data
    const [historyStrategies, setHistoryStrategies] = useState<
        Array<InvestmentStrategyHistory>
    >([]);

    const existingUser: User = useSelector((state: RootState) => {
        return state.user;
    });

    // reference: https://stackoverflow.com/questions/71593360/how-to-avoid-multiple-api-calls-in-a-react-custom-hook
    // avoid multiple requests
    useEffect(() => {
        setNeedApiRequest(true);
    }, []);

    useEffect(() => {
        if (!needApiRequest) {
            return;
        }
        const fetchHistoryData = async () => {
            const historyResponse = await fetch(
                `/api/v1/investment/history/user/${existingUser.id}`
            );
            const historyResponseJson = await historyResponse.json();
            if (historyResponseJson.success === false) {
                alert(historyResponseJson.message);
                return;
            }
            setHistoryData(historyResponseJson['strategies']);
        };

        fetchHistoryData();
        setNeedApiRequest(true);
    }, [needApiRequest, existingUser.id]);

    useEffect(() => {
        let historyStrategies: Array<InvestmentStrategyHistory> = historyData;
        if (historyStrategies.length === 0) {
            return;
        }
        // separate datasets out by strategy
        for (let strategy of historyStrategies) {
            let currentDataSet: Array<LineGraphDatasetData> = [];
            let labels: Array<string> = [];
            // go through assets of current strategy
            for (let asset of strategy.assets) {
                if (labels.length === 0) {
                    labels = asset.history.map((record: HistoryData) => {
                        // change from yyyy-mm-dd to mm-dd
                        // split - will create array [yyyy, mm, dd]
                        // index 1 to 3 (not inclusive of index 3), so 1 to 2
                        // split on -, slice array index from 1 to 3 and join using -
                        return record.day.split('-').slice(1, 3).join('-');
                    });
                    // reverse labels, date
                    labels = labels.reverse();
                }

                let historyValues: Array<number> = asset.history.map(
                    (record: HistoryData) => {
                        if (record.value > maxDataValue) {
                            setMaxDataValue(record.value);
                        }
                        return Number(record.value.toFixed(2));
                    }
                );

                // reverse values to match labels
                historyValues = historyValues.reverse();

                const datasetData: LineGraphDatasetData = {
                    label: asset.symbol,
                    data: historyValues,
                    fill: true,
                    backgroundColor: randomColor(),
                    borderColor: randomColor()
                };

                // update dataset for current strategy
                currentDataSet.push(datasetData);
                const historyDataGraph: LineGraphData = {
                    labels: labels,
                    datasets: currentDataSet
                };
                strategy.lineGraphData = historyDataGraph;
            }
        }
        setHistoryStrategies(historyStrategies);
    }, [historyData, maxDataValue]);

    const lineGraphs =
        historyStrategies.length > 0
            ? historyStrategies.map((strategy: InvestmentStrategyHistory) => {
                  return (
                      <LineGraphHistory
                          key={strategy.strategy_id}
                          lineGraphData={
                              strategy.lineGraphData as LineGraphData
                          }
                          strategy_name={strategy.strategy_name}
                          maxValue={maxDataValue}
                      />
                  );
              })
            : '';

    return (
        <Container>
            <h3> Investment History </h3>
            {lineGraphs}
        </Container>
    );
};

export default History;
