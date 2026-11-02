import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import cors from "cors";
import { jwtVerify, createRemoteJWKSet } from "jose";

//define express app and port
const app = express();
const port = 5000;

//middleware
app.use(cors());
app.use(express.json());

//connect to MongoDB
const client = new MongoClient(process.env.MONGODB_URI);

//connect to MongoDB function
export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

//connect to MongoDB and get the destinations collection
const mongoclient = await connectToMongoDB();
const database = mongoclient.db("wanderlust");
const destinationsCollection = database.collection("destinations");
const usersCollection = database.collection("users");
const bookingsCollection = database.collection("bookings");

//verify token
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.FRONTEND_URL}/api/auth/jwks`),
  );

  const { payload } = await jwtVerify(token, JWKS);

  console.log(payload);

  next();
};

//routes
app.get("/", (req, res) => {
  res.send("Welcome to Wanderlust API");
});

//add-destination route
app.post("/add-destination", verifyToken, async (req, res) => {
  const destination = req.body;
  const result = await destinationsCollection.insertOne(destination);
  console.log(result);
  res.send(result);
});

//get-destinations route
app.get("/destinations", async (req, res) => {
  const cursor = destinationsCollection.find({});
  const destinations = await cursor.toArray();
  res.send(destinations);
});

// get 5 destinations
app.get("/featured-destinations", async (req, res) => {
  const result = await destinationsCollection.find({}).limit(5).toArray();
  res.send(result);
});

//destination by ID route
app.get("/destinations/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const destination = await destinationsCollection.findOne({
    _id: new ObjectId(id),
  });

  res.send(destination);
});

//update-destination route
app.patch("/destinations/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const updatedDestination = req.body;

  const result = await destinationsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedDestination },
  );

  res.send(result);
});

//delete-destination route
app.delete("/destinations/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const result = await destinationsCollection.deleteOne({
    _id: new ObjectId(id),
  });
  res.send(result);
});

//get-users route
app.get("/users", verifyToken, async (req, res) => {
  const cursor = usersCollection.find({});
  const users = await cursor.toArray();
  res.send(users);
});

//add bookings
app.post("/bookings", verifyToken, async (req, res) => {
  const booking = req.body;
  const result = await bookingsCollection.insertOne(booking);
  console.log(result);
  res.send(result);
});

//get bookings
app.get("/bookings", verifyToken, async (req, res) => {
  const cursor = bookingsCollection.find({});
  const bookings = await cursor.toArray();
  res.send(bookings);
});

//get bookings by user email
app.get("/bookings/:email", verifyToken, async (req, res) => {
  const { email } = req.params;
  const cursor = bookingsCollection.find({ userEmail: email });
  const bookings = await cursor.toArray();
  res.send(bookings);
});

//get booking by ID
app.get("/booking/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const booking = await bookingsCollection.findOne({
    _id: new ObjectId(id),
  });

  res.send(booking);
});

//delete booking by ID
app.delete("/booking/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const result = await bookingsCollection.deleteOne({
    _id: new ObjectId(id),
  });
  res.send(result);
});

//listen to port
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

export default app;
