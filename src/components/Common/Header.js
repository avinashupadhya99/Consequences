import GIF from '../../hiy1.gif';
import { useEffect, useState } from 'react';
import GoogleButton from 'react-google-button';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';

import firebase, { auth, db } from '../../firebase.js';
import { debounce } from '@material-ui/core';

function Header () {
    const [user, setUser] = useState(null);
    const [joinModalShow, setJoinModalShow] = useState(false);
    const [alertShow, setAlertShow] = useState(false);
    const [alertVariant, setAlertVariant] = useState('warning');
    const [alertData, setAlertData] = useState('');
    const [room, setRoom] = useState({ roomcode: '' });

    const history = useHistory();

    const handleJoinModalClose = () => setJoinModalShow(false);
    const handleJoinModalShow = () => setJoinModalShow(true);

    const signInWithGoogle = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).then(result => {
            setUser(result.user);
            console.log(result.user.uid);
            if(result.additionalUserInfo.isNewUser) {
                db.collection("users").doc(result.user.uid).set({
                    username: result.user.displayName,
                    roomID: null
                })
            }
        }).catch(err => {
            setAlertData(err.message);
            setAlertVariant('danger');
            setAlertShow(true);
        });
    }

    useEffect(() => {
        auth.onAuthStateChanged(user => {
            setUser(user);
        });
    }, []);
    
    useEffect(() => {
        if(user) {
            db.collection("users").doc(user.uid)
            .onSnapshot(function(snapshot) {
                if(snapshot.exists) {
                    const roomID = snapshot.data().roomID
                    console.log(roomID);
                    if(roomID) {
                        const roomPath = `/rooms/${roomID}`;
                        console.log(roomPath);
                        history.push(roomPath);
                    }
                } else {
                    // Create user collection if not exists
                    db.collection("users").doc(user.uid).set({
                        roomID: null
                    })
                }
            });
        }
    }, [user]);

    const join = (e) => {
        e.preventDefault();
        setJoinModalShow(false);
        db.collection("rooms").doc(room.roomcode).get()
        .then((roomDoc) => {
            console.log(roomDoc.data());
            if(roomDoc.exists) {
                if(roomDoc.data().started) {
                    setAlertData("Game started in that room");
                    setAlertVariant('danger');
                    setAlertShow(true);
                } else if(roomDoc.data().owner===user.uid) {
                    const roomPath = `/rooms/${roomDoc.id}`;
                    console.log(roomPath);
                    history.push(roomPath);
                } else {
                    db.collection("rooms").doc(room.roomcode).collection('joinRequests').doc(user.uid).set({
                        userid: user.uid,
                        username: user.displayName
                    })
                    .then(() => {
                        setAlertData("Request sent to room owner. Please wait for the room owner to accept");
                        setAlertVariant('info');
                        setAlertShow(true);
                    })
                    .catch((err) => {
                        console.error(err);
                        setAlertData("Something went wrong");
                        setAlertVariant('danger');
                        setAlertShow(true);
                    })
                    
                }
            } else {
                setAlertData("Room does not exist, please check the room code");
                setAlertVariant('danger');
                setAlertShow(true);
            }
        }).catch(err => {
            console.error(err);
            setAlertData("Error while joining room");
            setAlertVariant('danger');
            setAlertShow(true);
        });
    }

    const createRoom = () => {
        db.collection("rooms").add({
            owner: {userid: user.uid, username: user.displayName},
            started: false,
            notifications: []
        })
        .then(function(roomDoc) {
            console.log("Document written with ID: ", roomDoc.id);
            db.collection("rooms").doc(roomDoc.id).collection('players').doc(user.uid).set({
                userid: user.uid,
                username: user.displayName
            }).then(() => {
                db.collection("users").doc(user.uid).update({
                    roomID: roomDoc.id
                }, { merge: true })
                .then(() => {
                    const roomPath = `/rooms/${roomDoc.id}`;
                    console.log(roomPath);
                    history.push(roomPath);
                })
                .catch((err) => {
                    console.error(err);
                })
            }).catch(playerErr => {
                console.error(playerErr);
            });
            
        })
        .catch((error) => {
            console.error("Error adding document: ", error);
        });
    }

    const onChange = (e) => {
        e.persist();
        setRoom({...room, [e.target.name]: e.target.value});
    };

    return (
        <div>
            { alertShow &&
            <div className="alert-container">
                <Alert className="header-alert" variant={alertVariant} onClose={() => setAlertShow(false)} dismissible>
                    <Alert.Heading>{alertData}</Alert.Heading>
                </Alert>
            </div>
            }
            <img className="img" src={GIF} alt="da" />

            <div className="Heading">
                <h1 className="heading1">Consequences</h1>
                <p className="intro-para">Your choices, <br/>
                    define your consequences.<br/>
                </p>
            </div>

            <div className="content">
                <p>a game in which players take turns to contribute sentences to a story. <br />The final story is then read out, usually with funny consequences.</p>
                {user ? 
                    <div className="sign-in-play">
                        <Button onClick={handleJoinModalShow} variant="primary" size="lg">Join Room</Button>&nbsp;&nbsp;
                        <Button onClick={createRoom} variant="primary" size="lg">Create Room</Button>&nbsp;&nbsp;
                    </div>
                    : 
                    <GoogleButton className="sign-in-play" id="customBtn" onClick={signInWithGoogle} />}
            </div>
            <Modal show={joinModalShow} onHide={handleJoinModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Join a room</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={join}>
                        <Form.Group>
                            <Form.Label>Room Code</Form.Label>
                            <Form.Control type="text" name="roomcode" id="roomcode" placeholder="Enter Room Code" value={room.roomcode} onChange={onChange} />
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            Join
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    )
}

export default Header;