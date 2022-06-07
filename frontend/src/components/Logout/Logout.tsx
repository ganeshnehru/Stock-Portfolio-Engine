import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LOGOUT_USER } from '../../store/actions';

const Logout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    useEffect(() => {
        // dispatch event to clear user and navigate back to '/'
        dispatch({
            type: LOGOUT_USER
        });
        navigate('/');
    }, [dispatch, navigate]);
    return <div></div>;
};

export default Logout;
