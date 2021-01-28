import Navbar from '../Common/Navbar';
import { Redirect, withRouter } from "react-router-dom";
import { auth, db } from "../../firebase";
import { useState, useEffect } from "react";
import { Alert, Button, Spinner } from 'react-bootstrap';
import { AiOutlineCheck,AiOutlineClose } from "react-icons/ai";
import { FaCrown, FaDiscord } from "react-icons/fa";
import { MdContentCopy } from "react-icons/md";
import { useHistory } from 'react-router-dom';
import { Formik } from "formik";
import * as Yup from "yup";

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

import { Error } from "../Common/Error";

import './room.css';

function Room({ match }) {
    const [loaded, setLoaded] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [roomUser={notLoaded:true}, setRoomUser] = useState(null);
    const [roomPlayers, setRoomPlayers] = useState([]);
    const [isRoomOwner, setIsRoomOwner] = useState(false);
    const [roomOwner, setRoomOwner] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [joinRequests, setJoinRequests] = useState([]);
    const [roomNotifications, setRoomNotifications] = useState([]);
    const [error, setError] = useState(false);

    const history = useHistory();
    
    useEffect(() => {
        db.collection("rooms").doc(match.params.id).get()
        .then(roomDocument => {
            if(!roomDocument.exists) {
                history.push("/");
            }
        }).catch(roomErr => {
            console.error(roomErr);
        });
        auth.onAuthStateChanged(user=> {
            setRoomUser(user);
            if(user) {
                db.collection("users").doc(user.uid).get()
                .then(userDoc => {
                    if(userDoc.data().roomID !== match.params.id) {
                        history.push("/");
                    }
                    db.collection("rooms").doc(match.params.id).get()
                    .then(roomDoc => {
                        setIsRoomOwner(roomDoc.data().owner.userid === user.uid);
                        setRoomOwner(roomDoc.data().owner);
                        setLoaded(true);
                    }).catch(roomError => {
                        console.error(roomError);
                    });
                }).catch(error => {
                    console.error(error);
                    setError(true);
                });
                db.collection("users").doc(user.uid)
                .onSnapshot(snapshot => {
                    if(snapshot.data().roomID==null) {
                        history.push("/");
                    }
                });
            } else {
                // setValidity(false);
                history.push("/");
            }
        })
    }, []);

    useEffect(() => {
        db.collection("rooms").doc(match.params.id)
        .onSnapshot(snapshot => {
            console.log(snapshot.data());
            if(snapshot.data() && snapshot.data().started!==gameStarted) {
                setGameStarted(snapshot.data().started);
            }
        });

        db.collection("rooms").doc(match.params.id).collection('joinRequests')
        .onSnapshot(snapshot => {
            const newJoinRequests = snapshot.docs.map(doc => doc.data());
            if(newJoinRequests!==joinRequests) {
                setJoinRequests(newJoinRequests);
            }
        });
        db.collection("rooms").doc(match.params.id).collection('players')
        .onSnapshot(snapshot => {
            const newPlayers = snapshot.docs.map(doc => {
                if(roomUser && doc.data().userid===roomUser.uid) {
                    setSubmitted(doc.data().submitted);
                }
                return doc.data()
            });
            
            const filteredPlayers = newPlayers.filter(player => player.userid!==roomOwner.userid);
            if(filteredPlayers!==roomPlayers) {
                setRoomPlayers(filteredPlayers);
            }
        });
    }, [loaded]);

    while(!loaded) {
        return (<>
            <div className="first-container">
                <Navbar />
            </div>
            <Spinner className="vertical-center"  animation="border" variant="primary" />
            </>)
    }    

    if(error) {
        // TODO: Return Error
        return <> </>
    }

    // if(!validity) {
    //     return <Redirect to={"/"} />
    // }

    const acceptRequest = (user) => {
        // TODO: Use promise.all to execute all queries at once
        db.collection("rooms").doc(match.params.id).collection('joinRequests').doc(user.userid).delete()
        .then(() => {
            db.collection("rooms").doc(match.params.id).collection('players').doc(user.userid).set({
                userid: user.userid,
                username: user.username,
                submitted: false
            }).then(() => {
                db.collection("users").doc(user.userid).update({
                    roomID: match.params.id
                }, { merge: true })
                .then(() => {
                    
                }).catch(userErr => {
                    console.error(userErr);
                });
            }).catch(playerAddError => {
                console.error(playerAddError);
            })
        })
        .catch((err) => {
            console.error(err);
        });
    };

    const rejectRequest = (user) => {
        db.collection("rooms").doc(match.params.id).collection('joinRequests').doc(user.userid).delete()
        .then(() => {
            // Inform the other of rejection ?  
            console.log('deleted request');
        })
        .catch((err) => {
            console.error(err);
        });
    };

    const deleteRoom = async () => {
        const queries = [];
        roomPlayers.forEach(roomPlayer => {
            queries.push(db.collection("users").doc(roomPlayer.userid).set({
                        roomID: null
                    }, {merge: true}));
        });
        queries.push(db.collection("users").doc(roomOwner.userid).set({
            roomID: null
        }, {merge: true}));
        await Promise.all(queries);
        db.collection("rooms").doc(match.params.id).delete()
        .then(() => { 
            console.log('deleted room');
            history.push("/");
        })
        .catch((err) => {
            console.error(err);
        });
    };

    const leaveRoom = () => {
        db.collection("users").doc(roomUser.uid).update({
            roomID: null
        }, {merge: true})
        .then(() => {
            db.collection("rooms").doc(match.params.id).collection('players').doc(roomUser.uid).delete()
            .then(() => {
                history.push("/");
            }).catch(roomErr => {
                console.err(roomErr);
            })
        }).catch(err => {
            console.error(err);
        });
        
    };

    const startGame = () => {
        try {
            db.collection("rooms").doc(match.params.id).update({
                started: true
            }, {merge: true}).then(() => {
                // Make API call to backend
                console.log("Game started");
            }).catch(err => {
                console.error(err);
                // Alert error
            })
        } catch(ex) {
            console.error(ex);
        }
        
    };

    const submitStory = ({ boy, girl, heAsked, sheSaid, sheAsked, heReplied, theyDecided, consequence }) => {
        db.collection("rooms").doc(match.params.id).collection("players").doc(roomUser.uid).update({
            submitted: true,
            boy,
            girl,
            heAsked,
            sheSaid,
            sheAsked,
            heReplied,
            theyDecided,
            consequence 
        }).then(() => {
            
        }).catch(err => {

        });
    };

    return(
        <>
            <div className="first-container">
                <Navbar />
            </div>
            <h5 className="text-center"><b>Room Code -</b> {match.params.id} <MdContentCopy className="copy-button" onClick={() => {navigator.clipboard.writeText(match.params.id)}} /></h5>
            {isRoomOwner && joinRequests.length>0 &&
                <div className="accept-requests">
                    <h5><b>Join requests</b></h5>
                    {joinRequests.map((joinRequest) => (
                        <div key={joinRequest.userid}>"{joinRequest.username}" wants to join the room. Accept request ? <Button variant="success" onClick={() => {acceptRequest(joinRequest)}}><AiOutlineCheck /></Button>{' '}<Button variant="danger" onClick={() => {rejectRequest(joinRequest)}}><AiOutlineClose /></Button></div>
                    ))}
                </div>
            }
            <div className="users">
                <h5><b>Users - </b></h5>
                <List dense={false} className="user-list">
                    <ListItem>
                    <FaCrown className="user-icon" />{' '}
                    <ListItemText
                        primary={roomOwner.username}
                    />
                    </ListItem>
                    {roomPlayers && 
                        roomPlayers.map((roomPlayer) => (
                            <ListItem key={roomPlayer.userid}>
                                <FaDiscord className="user-icon" />{' '}
                                <ListItemText
                                    primary={roomPlayer.username}
                                />
                            </ListItem>
                        ))
                    }
                </List>
            </div>
            {isRoomOwner && 
                <Button className="float-right room-exit" variant="danger" onClick={deleteRoom}>Delete Room</Button>
            }
            {!isRoomOwner && 
                <Button className="float-right room-exit" variant="danger" onClick={leaveRoom}>Leave Room</Button>
            }
            <div className="notifications">
                {roomNotifications.map((roomNotification) => (
                    <Alert className="header-alert" variant="info" dismissible>
                        {roomNotification}
                    </Alert>
                ))}
            </div>
            {gameStarted && !submitted &&
                <div className="third-container">
                    <h3>play</h3>

                    <Formik
                        initialValues={{ boy: "", girl: "", met: "", heAsked: "", sheSaid: "", sheAsked: "", heReplied: "", theyDecided: "", consequence: "" }}
                        onSubmit={values => {
                            submitStory(values);
                        }}
                        validationSchema={Yup.object().shape({
                            boy: Yup.string().required("Required"),
                            girl: Yup.string().required("Required"),
                            met: Yup.string().required("Required"),
                            heAsked: Yup.string().required("Required"),
                            sheSaid: Yup.string().required("Required"),
                            sheAsked: Yup.string().required("Required"),
                            heReplied: Yup.string().required("Required"),
                            theyDecided: Yup.string().required("Required"),
                            consequence: Yup.string().required("Required"),
                        })}
                        >
                        {props => {
                            const {
                            values,
                            touched,
                            errors,
                            dirty,
                            isSubmitting,
                            handleChange,
                            handleBlur,
                            handleSubmit,
                            handleReset
                            } = props;
                            return (
                            <form onSubmit={handleSubmit} className="form-inline">
                                <div className="form-group">
                                    <label style={{ display: "block" }}>boy:</label>
                                    <input id="boy" placeholder="Enter the name of boy" type="text" value={values.boy}
                                    onChange={handleChange} onBlur={handleBlur} className={
                                        errors.boy && touched.boy
                                        ? "form-control text-input error"
                                        : "form-control text-input"
                                    } />
                                    {errors.boy && touched.boy && (
                                    <div className="input-feedback">{errors.boy}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label style={{ display: "block" }}>girl:</label>
                                    <input id="girl" placeholder="Enter the name of girl" type="text" value={values.girl}
                                    onChange={handleChange} onBlur={handleBlur} className={
                                        errors.girl && touched.girl
                                        ? "form-control text-input error"
                                        : "form-control text-input"
                                    } />
                                    {errors.girl && touched.girl && (
                                    <div className="input-feedback">{errors.girl}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label style={{ display: "block" }}>met:</label>
                                    <input id="met" placeholder="where did they meet" type="text" value={values.met}
                                    onChange={handleChange} onBlur={handleBlur} className={
                                        errors.met && touched.met
                                        ? "form-control text-input error"
                                        : "form-control text-input"
                                    } />
                                    {errors.met && touched.met && (
                                    <div className="input-feedback">{errors.met}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label style={{ display: "block" }}>he asked:</label>
                                    <input id="heAsked" placeholder="boy asked girl" type="text" value={values.heAsked}
                                    onChange={handleChange} onBlur={handleBlur} className={
                                        errors.heAsked && touched.heAsked
                                        ? "form-control text-input error"
                                        : "form-control text-input"
                                    } />
                                    {errors.heAsked && touched.heAsked && (
                                    <div className="input-feedback">{errors.heAsked}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label style={{ display: "block" }}>she said:</label>
                                    <input id="sheSaid" placeholder="i am..." type="text" value={values.sheSaid}
                                    onChange={handleChange} onBlur={handleBlur} className={
                                        errors.sheSaid && touched.sheSaid
                                        ? "form-control text-input error"
                                        : "form-control text-input"
                                    } />
                                    {errors.sheSaid && touched.sheSaid && (
                                    <div className="input-feedback">{errors.sheSaid}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label style={{ display: "block" }}>she asked:</label>
                                    <input id="sheAsked" placeholder="what do you..." type="text" value={values.sheAsked}
                                    onChange={handleChange} onBlur={handleBlur} className={
                                        errors.sheAsked && touched.sheAsked
                                        ? "form-control text-input error"
                                        : "form-control text-input"
                                    } />
                                    {errors.sheAsked && touched.sheAsked && (
                                    <div className="input-feedback">{errors.sheAsked}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label style={{ display: "block" }}>he replied:</label>
                                    <input id="heReplied" placeholder="what do you..." type="text" value={values.heReplied}
                                    onChange={handleChange} onBlur={handleBlur} className={
                                        errors.heReplied && touched.heReplied
                                        ? "form-control text-input error"
                                        : "form-control text-input"
                                    } />
                                    {errors.heReplied && touched.heReplied && (
                                    <div className="input-feedback">{errors.heReplied}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label style={{ display: "block" }}>they decided:</label>
                                    <input id="theyDecided" placeholder="what do you..." type="text" value={values.theyDecided}
                                    onChange={handleChange} onBlur={handleBlur} className={
                                        errors.theyDecided && touched.theyDecided
                                        ? "form-control text-input error"
                                        : "form-control text-input"
                                    } />
                                    {errors.theyDecided && touched.theyDecided && (
                                    <div className="input-feedback">{errors.theyDecided}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label style={{ display: "block" }}>the consequence was:</label>
                                    <input id="consequence" placeholder="what do you..." type="text" value={values.consequence}
                                    onChange={handleChange} onBlur={handleBlur} className={
                                        errors.consequence && touched.consequence
                                        ? "form-control text-input error"
                                        : "form-control text-input"
                                    } />
                                    {errors.consequence && touched.consequence && (
                                    <div className="input-feedback">{errors.consequence}</div>
                                    )}
                                </div>
                                <button
                                type="button"
                                className="outline btn btn-danger"
                                onClick={handleReset}
                                disabled={!dirty || isSubmitting}
                                >
                                Reset
                                </button>&nbsp;
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                Submit Story
                                </button>
                            </form>
                            );
                        }}
                        </Formik>
                </div>
            }
            {isRoomOwner && !gameStarted &&
                <Button onClick={startGame} variant="primary" size="lg">Start Game</Button>
            }
            {!isRoomOwner && !gameStarted &&
                <>
                    Waiting for the owner to start the game
                </>
            }
        </>
    )
    

    
}

export default withRouter(Room);