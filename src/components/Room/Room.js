import Navbar from '../Common/Navbar';
import { Redirect, withRouter } from "react-router-dom";
import { auth, db } from "../../firebase";
import { useState, useEffect } from "react";
import { Alert, Button, Spinner } from 'react-bootstrap';
import { AiOutlineCheck,AiOutlineClose } from "react-icons/ai";
import { FaCrown, FaDiscord } from "react-icons/fa";
import { MdContentCopy } from "react-icons/md";
import { useHistory } from 'react-router-dom';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

// import { Error } from "../Common/Error";

import './room.css';

function Room({ match }) {
    const [validity, setValidity] = useState({notLoaded:true});
    const [roomUser={notLoaded:true}, setRoomUser] = useState(null);
    const [roomPlayers, setRoomPlayers] = useState(null);
    const [isRoomOwner, setIsRoomOwner] = useState(false);
    const [roomOwner, setRoomOwner] = useState(false);
    const [joinRequests, setJoinRequests] = useState([]);
    // const [roomNotifications, setRoomNotifications] = useState([]);
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
                    setValidity(userDoc.data().roomID === match.params.id);
                    if(userDoc.data().roomID !== match.params.id) {
                        history.push("/");
                    }
                    db.collection("rooms").doc(match.params.id).get()
                    .then(roomDoc => {
                        console.log(roomDoc);
                        setIsRoomOwner(roomDoc.data().owner.uid === user.uid);
                        setRoomOwner(roomDoc.data().owner);
                        console.log(roomDoc.data().owner);
                    }).catch(roomError => {
                        console.error(roomError);
                    });
                    console.log(userDoc.data().roomID);
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
                setValidity(false);
                history.push("/");
            }

            db.collection("rooms").doc(match.params.id).collection('joinRequests')
            .onSnapshot(snapshot => {
                console.log(snapshot.docs);
                const newJoinRequests = snapshot.docs.map(doc => doc.data());
                if(newJoinRequests!==joinRequests) {
                    setJoinRequests(newJoinRequests);
                }
            });
            db.collection("rooms").doc(match.params.id).collection('players')
            .onSnapshot(snapshot => {
                console.log(snapshot.docs);
                const newPlayers = snapshot.docs.map(doc => doc.data());
                if(newPlayers!==roomPlayers) {
                    setRoomPlayers(newPlayers);
                }
            });
        })
    }, []);

    while(validity.notLoaded) {
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
                username: user.username
            }).then(() => {
                db.collection("users").doc(user.userid).update({
                    roomID: match.params.id
                }, { merge: true })
                .then(() => {
                    
                }).catch(userErr => {
                    console.log(userErr);
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
        queries.push(db.collection("users").doc(roomOwner.uid).set({
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

    return(
        <>
            <div className="first-container">
                <Navbar />
            </div>
            <h5 class="text-center"><b>Room Code -</b> {match.params.id} <MdContentCopy className="copy-button" onClick={() => {navigator.clipboard.writeText(match.params.id)}} /></h5>
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
                        primary={roomOwner.displayName}
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
            {/* <div className="notifications">
                {roomNotifications.map((roomNotification) => (
                    <Alert className="header-alert" variant="info" dismissible>
                        {roomNotification}
                    </Alert>
                ))}
            </div> */}
            <div className="third-container">
                <h3>play</h3>

                <form action="" className="form-inline">
                    <div className="form-group">
                        <label>boy:</label>
                        <input type="text" className="form-control" placeholder="Enter the name of boy" id="boy" />
                    </div>
                    <div className="form-group">
                        <label>girl:</label>
                        <input type="text" className="form-control" placeholder="enter the name of girl" id="girl" />
                    </div>
                    <div className="form-group">
                        <label>met:</label>
                        <input className="form-control" placeholder="where did they meet" id="met" />
                    </div>
                    <div className="form-group">
                        <label>he asked:</label>
                        <input className="form-control" placeholder="boy asked girl" id="he-asked" />
                    </div>
                    <div className="form-group">
                        <label>she replied:</label>
                        <input  className="form-control" placeholder="i am..." id="" />
                    </div>
                    <div className="form-group">
                        <label>she asked:</label>
                        <input className="form-control" placeholder="what do you..." id="" />
                    </div>
                    <div className="form-group">
                        <label>he replied:</label>
                        <input className="form-control" placeholder="yes, but..." id="" />
                    </div>
                    <div className="form-group">
                        <label>they decided:</label>
                        <input className="form-control" placeholder="let us.." id="" />
                    </div>
                    <div className="form-group">
                        <label>the consequence was:</label>
                        <input className="form-control" placeholder="" id="" />
                    </div>

                    <button type="submit" className="btn btn-primary ">Show story</button>
                </form>
            </div>
        </>
    )
    

    
}

export default withRouter(Room);