import Navbar from '../Common/Navbar';
import { Redirect, withRouter } from "react-router-dom";
import { auth, db } from "../../firebase";
import { useState, useEffect } from "react";
import { Alert, Button, Spinner } from 'react-bootstrap';
import { AiOutlineCheck,AiOutlineClose } from "react-icons/ai";
import { FaCrown, FaDiscord } from "react-icons/fa";
import { useHistory } from 'react-router-dom';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

import { Error } from "../Common/Error";

import './room.css';

function Room({ match }) {
    const [validity, setValidity] = useState({notLoaded:true});
    const [roomUser={notLoaded:true}, setRoomUser] = useState(null);
    const [roomPlayer={notLoaded:true}, setRoomPlayer] = useState(null);
    const [isRoomOwner, setIsRoomOwner] = useState(false);
    const [roomOwner, setRoomOwner] = useState(false);
    const [joinRequests, setJoinRequests] = useState([]);
    const [roomNotifications, setRoomNotifications] = useState([]);
    const [error, setError] = useState(false);

    const history = useHistory();
    
    useEffect(() => {
        auth.onAuthStateChanged(user=> {
            setRoomUser(user);
            if(user) {
                db.collection("users").doc(user.uid).get()
                .then(userDoc => {
                    setValidity(userDoc.data().roomID === match.params.id);
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
                })
            } else {
                console.log("no user");
                setValidity(false);
            }
            db.collection("rooms").doc(match.params.id)
            .onSnapshot(function(snapshot) {
                console.log(snapshot.data().joinRequests);   
                const joinRequestsSnapshot  = snapshot.data().joinRequests;
                const notifications = snapshot.data().notifications;
                const player = snapshot.data().player;
                console.log(player);
                if(joinRequestsSnapshot && joinRequestsSnapshot!==joinRequests) {
                    setJoinRequests(joinRequestsSnapshot);
                }
                if(notifications && notifications!==roomNotifications) {
                    setRoomNotifications(notifications);
                }
                if(player!=roomPlayer) {
                    setRoomPlayer(player);
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
        db.collection("rooms").doc(match.params.id).update({
            joinRequests: [],
            player: user
        }, { merge: true })
        .then(() => {
            db.collection("users").doc(user.userid).update({
                roomID: match.params.id
            }, { merge: true })
            .then(() => {

            }).catch(userErr => {
                console.log(userErr);
            });
        })
        .catch((err) => {
            console.error(err);
        })
    };

    const rejectRequest = (user) => {

    };

    const deleteRoom = () => {

    };

    const leaveRoom = () => {
        db.collection("users").doc(roomUser.uid).update({
            roomID: null

        }, {merger: true})
        .then(() => {
            db.collection("rooms").doc(match.params.id).update({
                player: null
            }, {merge: true})
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
                    {roomPlayer && 
                        <ListItem>
                            <FaDiscord className="user-icon" />{' '}
                            <ListItemText
                                primary={roomPlayer.username}
                            />
                        </ListItem>
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