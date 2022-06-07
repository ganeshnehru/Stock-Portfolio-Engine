import { AnyAction } from 'redux';
import { LOGOUT_USER, UPDATE_SUGGESTIONS } from '../actions';
import { Suggestions, SuggestionAction } from '../../types/types';

// redux state for suggestion results
const initialSuggestionsState: Suggestions = {
    strategies: [],
    investment: 0,
    date: ''
};

const reducer = (
    state: Suggestions = initialSuggestionsState,
    action: SuggestionAction | AnyAction
) => {
    switch (action.type) {
        case UPDATE_SUGGESTIONS:
            return {
                ...state,
                investment: action.investment,
                date: action.date,
                strategies: [...action.strategies]
            };
        case LOGOUT_USER:
            return initialSuggestionsState;
        default:
            return state;
    }
};

export default reducer;
