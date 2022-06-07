import React, { useState } from 'react';
import { Button, Container, Form } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { UPDATE_LOGIN_USER } from '../../store/actions';
import { User } from '../../types/types';
import { UserRoutes } from '../../enums';

enum LoginFields {
    loginUserName = 'loginUserName',
    LoginPassword = 'loginPassword'
}

const Login = () => {
    const [loginUserName, setLoginUserName] = useState<string>('');
    const [loginPassword, setLoginPassword] = useState<string>('');
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.name === LoginFields.loginUserName) {
            setLoginUserName(event.target.value);
            return;
        }
        setLoginPassword(event.target.value);
    };

    const submitLoginInfo = async () => {
        const loginBodyData = JSON.stringify({
            user_username: loginUserName,
            user_password: loginPassword
        });

        const loginUserResponse = await fetch(UserRoutes.LoginRoute, {
            method: 'POST',
            body: loginBodyData
        });

        const loginUserData = await loginUserResponse.json();
        if (loginUserData.success) {
            // TODO get login user data from response, need user id, user name in login response
            const loginUser: User = {
                username: loginUserName,
                name: loginUserData.user_name,
                id: loginUserData.user_id
            };
            dispatch({
                type: UPDATE_LOGIN_USER,
                user: loginUser
            });

            navigate('/');
        } else {
            alert(loginUserData.message);
        }
    };

    return (
        <Container className="suggestionsContainer" fluid="lg">
            <h4> Login </h4>
            <Form className="suggestionForms">
                <Form.Group className="suggestionForm">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                        type="text"
                        name="loginUserName"
                        placeholder="Enter username"
                        onChange={onInputChange}
                    />
                    <Form.Text className="text-muted">
                        Don't have an account? Click here to
                        <Link to="/signup"> sign up </Link>
                    </Form.Text>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Password"
                        onChange={onInputChange}
                    />
                </Form.Group>
                <Button
                    className="loginButton formButton"
                    variant="primary"
                    onClick={submitLoginInfo}
                >
                    Login
                </Button>
            </Form>
        </Container>
    );
};

export default Login;
