import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavbarComponent from './components/NavbarComponent/NavbarComponent';
import NewSuggestion from './components/NewSuggestion/NewSuggestion';
import SuggestionResults from './components/SuggestionResults/SuggestionResults';
import History from './components/History/History';
import Signup from './components/Signup/Signup';
import Login from './components/Login/Login';
import EditUser from './components/EditUser/EditUser';
import ExistingResults from './components/ExistingResults/ExistingResults';
import Logout from './components/Logout/Logout';

const App = () => {
    return (
        <Router>
            <NavbarComponent />
            <Routes>
                <Route path="/" element={<NewSuggestion />}></Route>
                <Route path="/login" element={<Login />}></Route>
                <Route path="/signup" element={<Signup />}></Route>
                <Route path="/suggestion" element={<NewSuggestion />}></Route>
                <Route
                    path="/existingSuggestion"
                    element={<ExistingResults />}
                ></Route>
                <Route path="/results" element={<SuggestionResults />}></Route>
                <Route path="/history" element={<History />}></Route>
                <Route path="/editUser" element={<EditUser />}></Route>
                <Route path="/logout" element={<Logout />}></Route>
            </Routes>
        </Router>
    );
};

export default App;
