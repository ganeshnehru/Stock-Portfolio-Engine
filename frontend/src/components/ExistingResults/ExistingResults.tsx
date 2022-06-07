import React, { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { UPDATE_SUGGESTIONS } from '../../store/actions';
import { RootState } from '../../store/store';
import {
    InvestmentStrategy,
    StockEtf,
    Suggestion,
    Suggestions,
    User
} from '../../types/types';
import SuggestionResult from '../SuggestionResult/SuggestionResult';

const ExistingResults = () => {
    const existingSuggestions: Suggestions = useSelector((state: RootState) => {
        return state.suggestions;
    });

    const [needApiRequest, setNeedApiRequest] = useState<boolean>(false);
    const currentUser: User = useSelector((state: RootState) => {
        return state.user;
    });
    const dispatch = useDispatch();

    // make API request to get existing strategy
    // reference: avoid multiple requests from hooks
    // https://stackoverflow.com/questions/71593360/how-to-avoid-multiple-api-calls-in-a-react-custom-hook
    useEffect(() => {
        // clear existing suggestions
        dispatch({
            type: UPDATE_SUGGESTIONS,
            strategies: []
        });
        setNeedApiRequest(true);
    }, [dispatch]);

    useEffect(() => {
        if (!needApiRequest) {
            return;
        }
        const fetchExistingResults = async () => {
            // /investment/current/user/<int:id>
            const existingResultsResponse = await fetch(
                `/api/v1/investment/current/user/${currentUser.id}`
            );
            const existingResultsJson = await existingResultsResponse.json();

            if (existingResultsJson.success === false) {
                alert(existingResultsJson.message);
                return;
            }

            if (
                existingResultsJson.strategies &&
                existingResultsJson.strategies.length > 0
            ) {
                // if multiple strategies, divide by 2
                if (existingResultsJson.strategies.length === 2) {
                    existingResultsJson.strategies.forEach(
                        (strategy: Suggestion) => {
                            strategy.assets = strategy.assets.map(
                                (asset: StockEtf) => {
                                    return {
                                        ...asset,
                                        percentage: asset.percentage / 2
                                    };
                                }
                            );
                        }
                    );
                }
                dispatch({
                    type: UPDATE_SUGGESTIONS,
                    strategies: existingResultsJson.strategies
                });
            }
        };
        fetchExistingResults();
        setNeedApiRequest(false);
    }, [needApiRequest, dispatch, currentUser]);

    const renderExistingSuggestions = (
        existingSuggestions.strategies || []
    ).map((suggestion: Suggestion) => {
        return (
            <SuggestionResult
                key={suggestion.strategy_id}
                strategy={suggestion.strategy || suggestion.strategy_name}
                assets={suggestion.assets || []}
            />
        );
    });
    return (
        <Container
            className="suggestionsContainer suggestionResults"
            fluid="lg"
        >
            <h4> Existing Suggestion Results </h4>
            {renderExistingSuggestions}
        </Container>
    );
};

export default ExistingResults;
