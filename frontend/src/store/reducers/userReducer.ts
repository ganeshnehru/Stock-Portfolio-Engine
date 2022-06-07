import { AnyAction } from 'redux';
import { User, UserLoginAction } from '../../types/types';
import { LOGOUT_USER, UPDATE_LOGIN_USER } from '../actions';

// redux state for suggestion results
const initialLoginUser: User = {
    username: '',
    name: '',
    id: -1
};

const reducer = (
    state: User = initialLoginUser,
    action: UserLoginAction | AnyAction
) => {
    switch (action.type) {
        case UPDATE_LOGIN_USER:
            return {
                ...action.user
            };
        case LOGOUT_USER:
            return initialLoginUser;
        default:
            return state;
    }
};

export default reducer;
