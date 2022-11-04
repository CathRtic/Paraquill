const functions = require("firebase-functions");
const admin = require('firebase-admin');
admin.initializeApp();

//Reference API tokens on Firestore database
const dbRef = admin.firestore().doc('tokens/HKRglb0ltjte43pIZCox')

//Initialize Twitter API
const twitApi = require('twitter-api-v2').default;
const twitClient = new twitApi({
    clientId: 'Client_ID',
    clientSecret: 'Client_SECRET'
})

// Step 1
exports.auth = functions.https.onRequest((request, Response) =>{});

// Step 2
exports.callback = functions.https.onRequest((request, Response) =>{});

// Step 3
exports.tweet = functions.https.onRequest((request, Response) =>{});