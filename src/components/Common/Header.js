import GIF from '../../hiy1.gif';
import GoogleButton from 'react-google-button';
import { Button } from 'react-bootstrap';

import firebase, { auth } from '../../firebase.js';

function Header (props) {

    const signInWithGoogle = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider);
    }

    return (
        <div>
            <img class="img" src={GIF} alt="da" />

            <div class="Heading">
                <h1 class="heading1">Consequences</h1>
                <p class="intro-para">Your choices, <br/>
                    define your consequences.<br/>
                </p>
            </div>

            <div class="content">
                <p>a game in which players take turns to contribute sentences to a story. <br />The final strory is then read out, usually with funny consequences.</p>
                {props.user ? 
                    <div className="sign-in-play">
                        <Button variant="primary" size="lg">Play</Button>&nbsp;&nbsp;
                        <Button variant="warning" size="lg"  onClick={() => auth.signOut()}>Sign out</Button>
                    </div>
                    : 
                    <GoogleButton className="sign-in-play" id="customBtn" onClick={signInWithGoogle} />}
            </div>
        </div>
    )
}

export default Header;