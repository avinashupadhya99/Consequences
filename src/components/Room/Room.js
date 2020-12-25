import Navbar from '../Common/Navbar';
import { Redirect, withRouter } from "react-router-dom";
import { auth, db } from "../../firebase";
import { useState, useEffect } from "react";
import { Button, Spinner } from 'react-bootstrap';
import { AiOutlineCheck,AiOutlineClose } from "react-icons/ai";

import { Error } from "../Common/Error";

import './room.css';

function Room({ match }) {
    const [validity, setValidity] = useState({notLoaded:true});
    const [roomUser={notLoaded:true}, setRoomUser] = useState(null);
    const [roomOwner, setRoomOwner] = useState(false);
    const [joinRequests, setJoinRequests] = useState([]);
    const [error, setError] = useState(false);

    
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
                        setRoomOwner(roomDoc.data().owner === user.uid);
                    }).catch(roomError => {

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
                if(joinRequestsSnapshot && joinRequestsSnapshot!==joinRequests) {
                    setJoinRequests(joinRequestsSnapshot);
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
            user: user.userid
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

    return(
        <>
            <div className="first-container">
                <Navbar />
            </div>
            {roomOwner &&
                <div className="accept-requests">
                    <h5><b>Join requests</b></h5>
                    {joinRequests.map((joinRequest) => (
                        <div key={joinRequest.userid}>"{joinRequest.username}" wants to join the room. Accept request ? <Button variant="success" onClick={() => {acceptRequest(joinRequest)}}><AiOutlineCheck /></Button>{' '}<Button variant="danger" onClick={() => {rejectRequest(joinRequest)}}><AiOutlineClose /></Button></div>
                    ))}
                </div>
            }
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