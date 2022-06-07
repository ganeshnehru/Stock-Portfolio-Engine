import React, { useState, useEffect } from 'react';
import { Button, Container, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { UPDATE_SUGGESTIONS } from '../../store/actions';
import { InvestmentStrategy, StockEtf, Suggestion } from '../../types/types';

interface InvestmentStrategiesSelected {
    [key: string]: boolean;
}

const NewSuggestion = () => {
    const MAX_SUGGESTIONS: number = 2;
    const MIN_MONEY_AMOUNT: number = 5000;
    const GET_ALL_STRATEGIES_ROUTE: string = '/api/v1/strategy/all';

    // state to keep track of user money input
    const [money, setMoney] = useState<number>();

    // state to keep track of available investment strategies
    const [availableStrategies, setAvailableStrategies] = useState<
        Array<InvestmentStrategy>
    >([]);

    // state to keep track of checked strategies
    const [strategies, setStrategies] = useState<Array<string>>([]);

    // state to keep track of max strategies selected
    const [isMaxSelected, setMaxSelected] = useState<boolean>(false);

    // state to keep track of selected strategies
    const [selectedStrategies, setSelectedStrategies] =
        useState<InvestmentStrategiesSelected>({});

    // setup navigate and dispatch hooks
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // make API request to get available strategies
    useEffect(() => {
        const fetchAvailableStrategies = async () => {
            const availableStrategiesResponse = await fetch(
                GET_ALL_STRATEGIES_ROUTE
            );

            const availableStratgiesJson =
                await availableStrategiesResponse.json();

            // get list of available strategies
            const availableStrategiesList: Array<InvestmentStrategy> =
                availableStratgiesJson.strategies;

            // set initial state of available strategies list and selections
            setAvailableStrategies(availableStrategiesList);
        };
        fetchAvailableStrategies();
    }, []);

    useEffect(() => {
        // set initial selections to be false
        let availableStrategiesObject: InvestmentStrategiesSelected = {};
        availableStrategies.forEach((strategy: InvestmentStrategy) => {
            availableStrategiesObject[strategy.strategy_name] = false;
        });
        setSelectedStrategies(availableStrategiesObject);
    }, [availableStrategies]);

    // use effect, method called when hook values changed
    useEffect(() => {
        // check which strategies are selected, reflect options checked/disabled
        let currentSelectedStrategies: InvestmentStrategiesSelected =
            selectedStrategies;
        Object.keys(selectedStrategies).forEach((strategy: string) => {
            if (strategy) {
                if (strategies.includes(strategy)) {
                    currentSelectedStrategies[strategy] = true;
                } else {
                    currentSelectedStrategies[strategy] = false;
                }
            }
        });
        setSelectedStrategies(currentSelectedStrategies);
        setMaxSelected(strategies.length === MAX_SUGGESTIONS);
    }, [strategies, selectedStrategies]);

    // handle input change for money amount
    const onMoneyInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value;
        if (inputValue) {
            setMoney(Number(inputValue));
        }
    };

    // handle investment strategy selections
    const onInvestmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const investmentInputValue: HTMLInputElement = event.target;
        let updatedStrategies: Array<string> = [];
        if (investmentInputValue.checked) {
            // add selected option
            updatedStrategies = [...strategies, investmentInputValue.value];
            setStrategies(updatedStrategies);
        } else {
            // remove unchecked option
            updatedStrategies = strategies.filter((strategy: string) => {
                return strategy !== investmentInputValue.value;
            });
            setStrategies(updatedStrategies);
        }
    };

    const submitStrategies = async () => {
        // check min amount of money provided and selected strategies
        if (money && money >= MIN_MONEY_AMOUNT && strategies.length > 0) {
            let requestMoneyAmount: number = money;
            let strategyAssets: Array<Suggestion> = [];
            const multipleStrategiesSelected =
                strategies.length === MAX_SUGGESTIONS;
            // API request for each selected strategy
            // check if 2 strategies selected, divide money amount in 2 and send request with divided money amount
            if (multipleStrategiesSelected) {
                requestMoneyAmount = money / 2;
            }
            // make GET request for each selected strategy
            for (let strategy of strategies) {
                let strategyId: number = -1;
                // grab strategy id based on selected
                for (let availableStrategy of availableStrategies) {
                    if (availableStrategy.strategy_name === strategy) {
                        strategyId = availableStrategy.strategy_id;
                        break;
                    }
                }
                let strategyAssetsResponse = await fetch(
                    `/api/v1/strategy/${strategyId}/assets/${requestMoneyAmount.toFixed(
                        2
                    )}`
                );

                let strategyAssetsJson = await strategyAssetsResponse.json();
                strategyAssetsJson['strategy'] = strategy;

                if (multipleStrategiesSelected) {
                    strategyAssetsJson.assets = strategyAssetsJson.assets.map(
                        (asset: StockEtf) => {
                            return {
                                ...asset,
                                percentage: asset.percentage / 2
                            };
                        }
                    );
                }

                strategyAssets.push(strategyAssetsJson);
            }

            // dispatch to redux to update stock/etf/history suggestion results
            // update redux state to reuse data throughout components
            dispatch({
                type: UPDATE_SUGGESTIONS,
                investment: money,
                date: new Date(),
                strategies: strategyAssets
            });

            // redirect to stock/etf suggestion results
            navigate('/results');
        }
    };

    // render available strategies
    const renderAvailableStrategies = (availableStrategies || []).map(
        (strategy: InvestmentStrategy) => {
            return (
                <Form.Check
                    key={strategy.strategy_name}
                    type="checkbox"
                    label={strategy.strategy_name}
                    value={strategy.strategy_name}
                    disabled={
                        isMaxSelected &&
                        !selectedStrategies[strategy.strategy_name]
                    }
                    onChange={onInvestmentChange}
                ></Form.Check>
            );
        }
    );

    return (
        <Container className="suggestionsContainer" fluid="lg">
            <h4> Suggestion Engine </h4>
            <Form className="suggestionForms">
                <Form.Group className="suggestionForm">
                    <Form.Label>
                        Amount of Money to Invest (Min $5000)
                    </Form.Label>
                    <Form.Control
                        type="number"
                        placeholder="Enter amount to invest"
                        onChange={onMoneyInputChange}
                    />
                </Form.Group>
                {money && money < MIN_MONEY_AMOUNT ? (
                    <p className="amountErrorMessage">
                        * Please enter value at least $5000
                    </p>
                ) : (
                    ''
                )}
                <Form.Group className="suggestionForm">
                    <Form.Label>
                        Investment Strategies (Select one or two)
                    </Form.Label>
                    {renderAvailableStrategies}
                </Form.Group>
                <Button
                    className="submitStrategyButton formButton"
                    variant="primary"
                    onClick={submitStrategies}
                    disabled={
                        !money ||
                        money < MIN_MONEY_AMOUNT ||
                        strategies.length === 0
                    }
                >
                    Next
                </Button>
            </Form>
        </Container>
    );
};

export default NewSuggestion;
