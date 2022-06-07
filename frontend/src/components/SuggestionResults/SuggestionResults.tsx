import { Button, Container } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store/store';
import { Suggestion, Suggestions, User } from '../../types/types';
import SuggestionResult from '../SuggestionResult/SuggestionResult';

const SuggestionResults = () => {
    const suggestions: Suggestions = useSelector(
        (state: RootState) => state.suggestions
    );

    const currentUser: User = useSelector((state: RootState) => state.user);
    const navigate = useNavigate();

    const saveInvestment = async () => {
        let assets: Array<any> = [];
        suggestions.strategies.forEach((strategy) => {
            assets = [...assets, ...strategy.assets];
        });
        const investmentData = JSON.stringify({
            user_id: currentUser.id,
            invt_datetime: suggestions.date,
            invt_value: suggestions.investment,
            assets: assets
        });
        const saveInvestmentResponse = await fetch('/api/v1/investment', {
            method: 'POST',
            body: investmentData
        });

        const saveInvestmentJson = await saveInvestmentResponse.json();
        if (saveInvestmentJson.success) {
            alert(saveInvestmentJson.message);
            navigate('/history');
        }
    };
    const suggestionResults = (suggestions.strategies || []).map(
        (suggestion: Suggestion) => {
            return (
                <SuggestionResult
                    key={suggestion.strategy_id}
                    strategy={suggestion.strategy}
                    assets={suggestion.assets}
                />
            );
        }
    );
    return (
        <Container
            className="suggestionsContainer suggestionResults"
            fluid="lg"
        >
            <h4> Suggestion Results </h4>
            <h6> Investment Amount: ${suggestions.investment?.toFixed(2)}</h6>
            {suggestionResults}
            <Button
                className="formButton"
                onClick={saveInvestment}
                disabled={currentUser.id === -1}
            >
                Save Investment
            </Button>
        </Container>
    );
};

export default SuggestionResults;
