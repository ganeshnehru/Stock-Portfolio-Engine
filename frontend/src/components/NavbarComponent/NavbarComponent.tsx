import { Navbar, Nav } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { Link } from 'react-router-dom';

const NavbarComponent = () => {
    // get user state from redux store
    const userLoginState = useSelector((state: RootState) => state.user);
    return (
        <Navbar className="justify-content-end" bg="light" variant="light">
            <Nav>
                {!userLoginState.username ? (
                    <Nav.Item>
                        <Nav.Link as={Link} to="/login">
                            Sign In
                        </Nav.Link>
                    </Nav.Item>
                ) : (
                    <Nav.Item>
                        <Nav.Link as={Link} to="/editUser">
                            Edit User
                        </Nav.Link>
                    </Nav.Item>
                )}

                <Nav.Item>
                    <Nav.Link as={Link} to="/suggestion">
                        New Suggestion
                    </Nav.Link>
                </Nav.Item>
                {
                    // show view history for logged in users only
                    userLoginState && userLoginState.username ? (
                        <Nav.Item>
                            <Nav.Link as={Link} to="/history">
                                View History
                            </Nav.Link>
                        </Nav.Item>
                    ) : (
                        ''
                    )
                }

                {
                    // show view existing suggestion for logged in user
                    userLoginState && userLoginState.username ? (
                        <Nav.Item>
                            <Nav.Link as={Link} to="/existingSuggestion">
                                View Existing Suggestion
                            </Nav.Link>
                        </Nav.Item>
                    ) : (
                        ''
                    )
                }

                {userLoginState.username ? (
                    <Nav.Item>
                        <Nav.Link as={Link} to="/logout">
                            Logout, {userLoginState.name}
                        </Nav.Link>
                    </Nav.Item>
                ) : (
                    ''
                )}
            </Nav>
        </Navbar>
    );
};

export default NavbarComponent;
