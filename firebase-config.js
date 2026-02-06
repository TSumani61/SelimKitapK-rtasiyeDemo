// Firebase Initialization (Compat Version for Vanilla JS)
const firebaseConfig = {
    apiKey: "AIzaSyDrSnlOUg2--1bhYcgUfSQx7INrwoeX6V8",
    authDomain: "selimkitap.firebaseapp.com",
    projectId: "selimkitap",
    storageBucket: "selimkitap.firebasestorage.app",
    messagingSenderId: "62629041240",
    appId: "1:62629041240:web:539a8767a450a8df4aa62d",
    measurementId: "G-ENC5V7JBGN"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization error:", error);
}
