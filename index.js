
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT||5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
console.log(process.env.DB_PASS)
console.log(process.env.DB_USER)

//  middleware
app.use(cors());
app.use(express.json());


require('dotenv').config()

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mh62rbj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const uri = "mongodb://localhost:27017"
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);



app.get('/',(req,res)=>{
    res.send('simple crud is running ')
})

app.listen(port,()=>{
    console.log(`runnging port ${port}`)
})