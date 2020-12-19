import './App.css';

import { auth } from './firebase.js';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import SignIn from './components/Authentication/SignIn';
import Landing from './components/Room/Landing';
import Room from './components/Room/Room';

function App() {

  const [user] = useAuthState(auth);

  return (
    <Router>
      <div className="App">
        <Switch>
          <Route exact path ="/">
            { user ? <Landing /> : <SignIn /> }
          </Route>
          <Route exact path="/rooms/:id" component={Room} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
