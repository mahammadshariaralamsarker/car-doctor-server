
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
var jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

//  middleware
app.use(cors({
  origin: [
    // 'http://localhost:5173',
    'car-doctor-416e8.web.app',
    'car-doctor-416e8.firebaseapp.com'
  ],
  credentials: true
}));
// const corsOptions = {
//   origin: ['http://localhost:5173','***'],
//   credentials: true,
//   optionSuccessStatus: 200,
// }
// app.use(cors(corsOptions))
app.use(express.json());
app.use(cookieParser());


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

// myself middle wares
const logger = async (req, res, next) => {
  console.log("called:", req.host, req.originalUrl)
  next();
}

const verifyToken = async (req, res, next) => {
  const token = req.cookies.token;
  console.log("Value of token middle wares:",token )
  if(!token){
    return res.status(401).send({message: 'Not Authorized'})
  }
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
    if(err){
      console.log(err)
      return res.status(401).send({message:"unthorized"})
    }
    console.log("value in the token", decoded)
    req.user= decoded;
    next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollections = client.db('car_doctor').collection("services");
    const bookingCollections = client.db('car_doctor').collection("bookings");

    //Token Create
    app.post('/jwt',logger, async (req, res) => {
      const user = req.body;
      console.log(user)
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1h' })
      console.log(token)
      console.log("token is from client", token)
      res
         .cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          // maxAge:60*60*1000
        })  
        .send({  success: true  })
    })
    // delete token from cookies
    app.post('/logout',async(req,res)=>{
      const user = req.body ;
      console.log("loged Out", user)
      res.clearCookie('token',{maxAge:0}).send({success:true})
    }),


    // Services Related Api
    app.get('/services',logger, async (req, res) => {
      const cursor = serviceCollections.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const options = {
        projection: { _id: 1, title: 1, price: 1, service_id: 1, img: 1 },
      };
      const result = await serviceCollections.findOne(query, options)
      res.send(result)
    })

    // Bookings
    app.get('/bookings',logger,verifyToken, async (req, res) => {
      // console.log(req.query.email)
      // console.log("token is from client", req.cookies.token)
      console.log("user in the valid token :" ,req.user )
    
      if( req.user.email !== req.query.email){
        return res.status(403).send({message: "forbidden access"})
      }
      
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await bookingCollections.find(query).toArray();
      res.send(result);
    })

    app.post('/bookings', async (req, res) => {
      console.log("token is from client", req.cookies.token)
      const booking = req.body;
      const result = await bookingCollections.insertOne(booking)
      res.send(result)
    })

    app.patch('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedBookings = req.body;
      console.log(updatedBookings);
      const updateDoc = {
        $set: {
          status: updatedBookings.status
        },
      };
      const result = await bookingCollections.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await bookingCollections.deleteOne(query);
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('simple crud is running ')
})

app.listen(port, () => {
  console.log(`runnging port ${port}`)
})
