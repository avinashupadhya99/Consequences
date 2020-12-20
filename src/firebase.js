import firebase from 'firebase';

// const settings = {timestampsInSnapshots: true};

const firebaseConfig = {
  apiKey: "AIzaSyCh0Wa8oYk06qpYzxTX-rr1DjFV5tgT3PU",
  authDomain: "consequences-37577.firebaseapp.com",
  projectId: "consequences-37577",
  storageBucket: "consequences-37577.appspot.com",
  messagingSenderId: "17722906504",
  appId: "1:17722906504:web:68610a39222b59b4c98c3d"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export const provider = new firebase.auth.GoogleAuthProvider();
export const auth = firebase.auth();
export const db = firebase.firestore();

export default firebase;