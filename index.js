const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { decode } = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

require('dotenv').config()



// middle were
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.havek.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const itemCollection = client.db("furnitures").collection("item");
        const addItemCollection = client.db("furnitures").collection("myaddeditem");


        // Auth
        app.post('/login', async (req, res) => {
            const email = req.body;
            // console.log(email);
            const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);
            res.send({ token });
        })


        // get item
        app.get('/item', async (req, res) => {
            const query = {};
            const cursor = itemCollection.find(query);
            const items = await cursor.toArray();
            res.send(items);
        });

        app.get('/item/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const item = await itemCollection.findOne(query);
            res.send(item);
        });

        app.get('/myitems', async (req, res) => {
            const email = req.query.email;
            const query = { userEmail: email };
            const cursor = itemCollection.find(query);
            const myitems = await cursor.toArray();
            res.send(myitems);
        })


        // update item
        app.put('/item/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };

            const updateDoc = {
                $set: {
                    inventory: data.newInventory,
                },
            };

            const result = await itemCollection.updateOne(
                filter,
                updateDoc,
                options
            );

            res.send(result);
        });


        // Post item
        app.post('/item', async (req, res) => {
            const newItem = req.body;
            const tokenInfo = req.headers.authorization;
            // console.log(tokenInfo);
            const [email, accessToken] = tokenInfo.split(' ')
            const decoded = verifyToken(accessToken)
            // console.log(decoded, decoded.email);
            if (email === decoded.email) {
                const result = await itemCollection.insertOne(newItem);
                res.send({success:'Uploded Successfully'});
            }else{
                res.send({success:'Unauthorized Access'})
            }
        });

        // My added Items api
        app.post('/myitems', async (req, res) => {
            const myaddeditem = req.body;
            const result = await addItemCollection.insertOne(myaddeditem);
            res.send(result);
        })

        // DELETE
        app.delete('/item/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await itemCollection.deleteOne(query);
            res.send(result);
        });
    }
    finally {

    }
}
run().catch(console.dir);


//function verify token 
function verifyToken(token) {
    let email;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            email = 'Invalid email'
        }
        if (decoded) {
            console.log(decoded)
            email = decoded
        }
    });
    return email;
}


app.get('/',(req, res)=>{
    res.send('Running My Server')
});

// trying to update heroku
app.get('/run',(req, res)=>{
    res.send('Running Heroku Update Server')
});

app.get('/items/:id', (req, res) => {
    console.log(req.params);
    res.send('finding id')
})

app.listen(port, () => {
    console.log('Listen to port', port);
})