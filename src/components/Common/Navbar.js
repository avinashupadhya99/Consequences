import { useHistory } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth } from '../../firebase.js';

function Navbar () {
    const [user, setUser] = useState(null);
    const history = useHistory();

    const redirectToHome = () => {
        history.push("/");
    };

    useEffect(() => {
        auth.onAuthStateChanged(function(user) {
            setUser(user);
        });
    }, [user]);

    return (
        <nav className="navbar navbar-expand-lg navbr-lg bg-light">
            <a className="navbar-brand links" href="/">consequences</a>
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav mr-auto">
                <li className="nav-item active">
                    <a className="nav-link" href="#about">About <span className="sr-only">(current)</span></a>
                </li>
                <li className="nav-item">
                    <a className="nav-link" href="#">play</a>
                </li>
                {user &&
                    <li className="nav-item">
                        <a className="nav-link links" onClick={() => {
                            auth.signOut();
                            history.push("/");
                        }}>Signout</a>
                    </li>
                }
                </ul>
            </div>
        </nav>
    )
}

export default Navbar;