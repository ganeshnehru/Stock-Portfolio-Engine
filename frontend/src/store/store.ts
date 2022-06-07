import { configureStore } from '@reduxjs/toolkit';
import { Store, combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { Suggestions, User } from '../types/types';
import suggestionsReducer from './reducers/suggestionsReducer';
import userReducer from './reducers/userReducer';

// setup root state
export interface RootState {
    user: User;
    suggestions: Suggestions;
}

// persist config to store reducer/store information
const persistConfig = {
    key: 'root',
    storage
};

// create root reducer by combining all reducers
const rootReducer = combineReducers({
    suggestions: suggestionsReducer,
    user: userReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// redux setup
// https://stackoverflow.com/questions/61704805/getting-an-error-a-non-serializable-value-was-detected-in-the-state-when-using
const store: Store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false
        })
});

export default store;
