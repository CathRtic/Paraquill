const functions = require("firebase-functions");
const admin = require('firebase-admin');
admin.initializeApp();

//Reference API tokens on Firestore database
const dbRef = admin.firestore().doc('tokens/demo');
const dbRef2 = admin.firestore().doc('tokens/test');


//Initialize Twitter API
const twitApi = require('twitter-api-v2').default;
const twitClient = new twitApi({
    clientId: 'YOUR_ID',
    clientSecret: 'YOUR_SECRET'
});

const callbackURL = 'http://127.0.0.1:5000/paraquill/us-central1/callback';

//initialize OpenAI
const {Configuration, OpenAIApi} = require('openai');
const configuration = new Configuration({
    organization: 'YOUR_ID',
    apiKey: 'YOUR_KEY',
});
const openai = new OpenAIApi(configuration);


// Step 1
exports.auth = functions.https.onRequest(async (_request, Response) => {

    const { url, codeVerifier, state } = twitClient.generateOAuth2AuthLink(
        callbackURL,
        { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] }
    );

    await dbRef.set({ codeVerifier, state });

    Response.redirect(url);
});

// Step 2
exports.callback = functions.https.onRequest(async (request, response) => {
    const { state, code } = request.query;

    const dbSnapshot = await dbRef.get();
    const { codeVerifier, state: storedState } = dbSnapshot.data();

    if (state != storedState) {
        return Response.status(400).send("Stored Token Mismatch")
    }

    const {
        client: loggedClient,
        accessToken,
        refreshToken,
    } = await twitClient.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri: callbackURL,
    });

    await dbRef2.set({ accessToken, refreshToken });

    const { data } = await loggedClient.v2.me(); // start using the client if you want

    response.send(data);
});

// Step 3
exports.tweet = functions.https.onRequest(async (request, response) => {
    const { refreshToken } = (await dbRef2.get()).data();

    const { client: refreshedClient,
        accessToken,
        refreshToken: newRefreshToken,
    } = await twitClient.refreshOAuth2Token(refreshToken);

    await dbRef2.set({accessToken, refreshToken: newRefreshToken});

    const nextTweet = await openai.createCompletion('text-davinci-001',{
        prompt: 'tweet something about Playboi Carti',
        max_tokens:64,
    });
    const {data} = await refreshedClient.v2.tweet(
        nextTweet.data.choices[0].text
    );
    
    response.send(data);
});