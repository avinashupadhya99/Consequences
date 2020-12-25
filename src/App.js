import './App.css';

import { auth } from './firebase.js';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

// import SignIn from './components/Authentication/SignIn';
import Landing from './components/Room/Landing';
import Room from './components/Room/Room';
import Navbar from './components/Common/Navbar';
import Header from './components/Common/Header';
import About from './components/Common/About';

function App() {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route exact path ="/">
            <div className="first-container" >
              <Navbar />
              <Header/>
            </div>
            <About />
          </Route>
          <Route exact path="/rooms/:id" component={Room} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
