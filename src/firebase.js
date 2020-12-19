import firebase from 'firebase';

// const settings = {timestampsInSnapshots: true};

const firebaseConfig = {
    apiKey: "AIzaSyDQD9ldZL7uTLKAeuGK45EtnFos6FOuCXQ",
    authDomain: "campfire-50820.firebaseapp.com",
    databaseURL: "https://campfire-50820.firebaseio.com",
    projectId: "campfire-50820",
    storageBucket: "campfire-50820.appspot.com",
    messagingSenderId: "600176148545",
    appId: "1:600176148545:web:2a6748fab783bfa6a386c0"
  };
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export const provider = new firebase.auth.GoogleAuthProvider();
export const auth = firebase.auth();
export const db = firebase.firestore();

export default firebase;