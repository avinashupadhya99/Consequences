import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { Redirect } from 'react-router-dom';
import { useEffect, useState } from 'react';

import Room from './Room';

import { auth, db } from '../../firebase';


function Landing () {
    const [user, setUser] = useState(null);
    const [modalShow, setModalShow] = useState(false);
    const [room, setRoom] = useState({ roomcode: '' });
    const [showLoading, setShowLoading] = useState(false);
    const [showWaiting, setShowWaiting] = useState(false);
    const [error, setError] = useState({show: false, message: ''});
    const [authError, setAuthError] = useState(false);
    const [userRoom, setUserRoom] = useState(false);
    const roomRef = db.collection("rooms");
    const userRef = db.collection("users");

    const handleModalClose = () => setModalShow(false);
    const handleModalShow = () => setModalShow(true);

    useEffect(() => {
        // Get current user
        auth.onAuthStateChanged(user=> {
            setUser(user);
            // If user is not found, set auth error which redirects to "/"
            if(!user) {
                setAuthError(true);
            } else {
                
                // Get the roomID for the current user
                userRef.doc(user.uid).get()
                .then(userDoc => {
                    if(userDoc.exists) {
                        const userData = userDoc.data();
                        if(userData.roomID && userData.roomID.length>0) {
                            console.log(userData.roomID);
                            setUserRoom(userData.roomID);
                        } 
                    } else {
                        // If user does not exist in the firestore, add it
                        userRef.doc(user.uid).set({
                            roomID: ""
                        }).then(() => {
                            
                        }).catch(userError => {
                            setAuthError(true);
                            
                        });
                    }
                })
            }
        })
    });
    
    const join = (e) => {
        e.preventDefault();
        setModalShow(false);
        setShowLoading(true);
        roomRef.doc(room.roomcode).get()
        .then(roomDoc => {
            if(roomDoc.exists) {
                roomRef.doc(room.roomcode).collection("requests").doc(user.uid).set({})
                .then(() => {
                    setShowLoading(false);
                    setShowWaiting(true);
                }).catch(reqError => {
                    console.error(reqError);
                    setShowLoading(false);
                    setError({show:true, message: "An error occurred while sending request. Please try again"});
                });
            } else {
                setShowLoading(false);
                setError({show:true, message: "Room does not exists. Please try again"});
            }
        }).catch(err => {
            console.log(err);
            setShowLoading(false);
            setError({show:true, message: "An error occurred. Please try again"});
        })

    };

    const onChange = (e) => {
        e.persist();
        setRoom({...room, [e.target.name]: e.target.value});
    };

    return (
        <>
            {authError &&
                <Redirect to={"/"} />
            }
            {userRoom &&
                <Redirect to={"/rooms/"+userRoom } />
            }
            {showLoading &&
                <Spinner className="vertical-center"  animation="border" variant="primary" />
            }
            {showWaiting &&
                <Alert className="vertical-center" variant="success">Please wait for the room owner to accept you</Alert>
            }
            {error.show &&
                <Alert className="vertical-center" variant="danger">{error.message}</Alert>
            }
            <br/>
            <Button variant="warning" onClick={handleModalShow}>Join a Room</Button> OR <Button variant="warning" onClick={createRoom}>Create a room</Button>

            <Modal show={modalShow} onHide={handleModalClose}>
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
        </>
    )
}

function createRoom() {
    const user = auth.currentUser;
    db.collection("users").doc(user.uid).get()
    .then((userDoc) => {
        if(userDoc.data().roomID) {
            const roomPath = `/rooms/${userDoc.data().roomID}`;
            <Redirect to={roomPath} />
        } else {
            db.collection("rooms").add({
                owner: user.uid,
                active: false
            })
            .then(function(roomDoc) {
                console.log("Document written with ID: ", roomDoc.id);
                db.collection("users").doc(user.uid).set({
                    roomID: roomDoc.id
                }, { merge: true })
                .then(() => {
                    <Room />
                })
                .catch((err) => {
                    console.error(err);
                })
            })
            .catch(function(error) {
                console.error("Error adding document: ", error);
            });
            
        }
    }).catch(userError => { 
        console.error(userError);
    });
}


export default Landing;