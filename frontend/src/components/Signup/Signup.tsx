import React, { useState } from 'react';
import { Button, Container, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { UserRoutes } from '../../enums';

enum SignupFields {
    signupUserName = 'loginUserName',
    signupPassword = 'signupPassword',
    signupFullName = 'signupFullName'
}

const Signup = () => {
    const [signupUserName, setSignupEmail] = useState<string>('');
    const [signupPassword, setSignupPassword] = useState<string>('');
    const [userFullName, setUserName] = useState<string>('');
    const navigate = useNavigate();

    const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.name === SignupFields.signupUserName) {
            setSignupEmail(event.target.value);
        } else if (event.target.name === SignupFields.signupPassword) {
            setSignupPassword(event.target.value);
        } else {
            setUserName(event.target.value);
        }
    };

    const submitSignupInfo = async () => {
        const signupUserData = JSON.stringify({
            user_name: userFullName,
            user_username: signupUserName,
            user_password: signupPassword
        });
        const signupUserResponse = await fetch(UserRoutes.UserRoute, {
            method: 'POST',
            body: signupUserData
        });

        const signupUserJson = await signupUserResponse.json();
        if (signupUserJson.message) {
            alert(signupUserJson.message);
        }
        // if successful, redirect
        if (signupUserJson.success) {
            // redirect to login after user successfully created
            navigate('/login');
        }
    };

    return (
        <Container className="suggestionsContainer" fluid="lg">
            <h4> Sign Up </h4>
            <Form className="suggestionForms">
                <Form.Group>
                    <Form.Label>User Full Name </Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter User Full Name"
                        name={SignupFields.signupFullName}
                        onChange={onInputChange}
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter Username"
                        name={SignupFields.signupUserName}
                        onChange={onInputChange}
                    />
                </Form.Group>

                <Form.Group>
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Password"
                        name={SignupFields.signupPassword}
                        onChange={onInputChange}
                    />
                </Form.Group>
                <Button
                    className="formButton"
                    variant="primary"
                    onClick={submitSignupInfo}
                >
                    Sign Up
                </Button>
            </Form>
        </Container>
    );
};

export default Signup;
