import GoogleButton from 'react-google-button'

import './authentication.css';
import firebase, { auth } from '../../firebase.js';

function SignIn() {

    const signInWithGoogle = () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider);
    }
  
    return (
      <GoogleButton className="sign-in" id="customBtn" onClick={signInWithGoogle} />
    )
  
  }

export default SignIn;