// Stock/ETF type
export interface StockEtf {
    stock_etf_id: number;
    symbol: string;
    name: string;
    num_shares: number;
    percentage: number;
    current_value: number;
}

// history data
export interface HistoryData {
    day: string;
    value: number;
}
// investment history, array of history data
export interface InvestmentHistory {
    stock_etf_id: number;
    history: Array<HistoryData>;
    symbol: string;
}

export interface InvestmentStrategyHistory {
    strategy_id: number;
    strategy_name: string;
    assets: Array<InvestmentHistory>;
    lineGraphData?: LineGraphData;
}

export interface LineGraphDatasetData {
    label: string;
    data: Array<number>;
    fill: boolean;
    backgroundColor?: string;
    borderColor?: string;
}

export interface LineGraphData {
    labels: Array<string>;
    datasets: Array<LineGraphDatasetData>;
}

// investment strategy
export interface InvestmentStrategy {
    strategy_id: number;
    strategy_name: string;
}

// Suggestions type, array of Suggestion
export interface Suggestions {
    investment?: number;
    date?: string;
    strategies: Array<Suggestion>;
}
// suggestion state
export interface Suggestion {
    strategy_id?: number;
    strategy_name?: string;
    strategy?: string;
    assets: Array<StockEtf>;
}

// action dispatched to update suggestions
export interface SuggestionAction {
    type: string;
    investment: number;
    date: string;
    strategies: Suggestions;
}
// User state
export interface User {
    username: string;
    name: string;
    id?: number;
}
// action dispatched to update login user
export interface UserLoginAction {
    type: string;
    user: User;
}
