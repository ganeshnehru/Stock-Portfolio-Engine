import React, { useState } from 'react';
import { Button, Container, Form } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { UPDATE_LOGIN_USER } from '../../store/actions';
import { RootState } from '../../store/store';
import { User } from '../../types/types';
import { UserRoutes } from '../../enums';

enum EditUserFields {
    EditUserFullName = 'newUserFullName',
    EditUserName = 'newUserName',
    EditPassword = 'newPassword'
}

const EditUser = () => {
    const [newUserFullName, setNewUserFullName] = useState<string>('');
    const [newUserName, setNewUserName] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const dispatch = useDispatch();
    const existingUser = useSelector((state: RootState) => {
        return state.user;
    });

    const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.name === EditUserFields.EditUserFullName) {
            setNewUserFullName(event.target.value);
        } else if (event.target.name === EditUserFields.EditUserName) {
            setNewUserName(event.target.value);
        } else {
            setNewPassword(event.target.value);
        }
    };

    const submitEditInfo = async () => {
        const editBodyData = JSON.stringify({
            user_name: newUserFullName || existingUser.name,
            user_username: newUserName || existingUser.username,
            // only add if new password set
            user_password: newPassword,
            user_id: existingUser.id
        });
        const editUserResponse = await fetch(UserRoutes.UserRoute, {
            method: 'PUT',
            body: editBodyData
        });

        const editUserJson = await editUserResponse.json();

        if (editUserJson.success) {
            alert(editUserJson.message);
            let updatedUser: User = {
                name: newUserFullName || existingUser.name,
                username: newUserName || existingUser.username,
                id: existingUser.id
            };
            dispatch({
                type: UPDATE_LOGIN_USER,
                user: updatedUser
            });
        }
    };

    return (
        <Container className="suggestionsContainer" fluid="lg">
            <h4> Edit User </h4>
            <Form className="suggestionForms">
                <Form.Group>
                    <Form.Label>New User Name </Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter New User Name"
                        name="newUserFullName"
                        onChange={onInputChange}
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label>New Username</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter new username"
                        name="newUserName"
                        onChange={onInputChange}
                    />
                </Form.Group>

                <Form.Group>
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Password"
                        name="newPassword"
                        onChange={onInputChange}
                    />
                </Form.Group>
                <Button
                    className="formButton"
                    variant="primary"
                    onClick={submitEditInfo}
                >
                    Submit Edit
                </Button>
            </Form>
        </Container>
    );
};

export default EditUser;
