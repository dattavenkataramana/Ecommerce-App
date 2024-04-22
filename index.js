

const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

mongoose.connect('mongodb+srv://datta:datta1234@cluster0.065gwsz.mongodb.net/data?retryWrites=true&w=majority')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String },
  email: { type: String, unique: true },
  profileImage: { type: String }
});

const User = mongoose.model('User', userSchema);


app.post('/users/register', async (req, res) => {
  const { username, password, fullName, email } = req.body;
  
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, password: hashedPassword, fullName, email });
    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    res.status(400).json({ message: 'Failed to register user', error: error.message });
  }
});

 
app.post('/users/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({email});
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

     
    const token = jwt.sign({  email:email }, 'secret_key');
    res.json({ message: 'Login successful', user, token });
    console.log("success")
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true }
});

const Product = mongoose.model('Product', productSchema);

 
const orderSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true }
});

const Order = mongoose.model('Order', orderSchema);
 
app.post('/products', async (req, res) => {
  const { name, price } = req.body;
  try {
    const newProduct = await Product.create({ name, price });
    res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (error) {
    res.status(400).json({ message: 'Failed to create product', error: error.message });
  }
});

 
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.post('/orders', async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const newOrder = await Order.create({ productId, quantity });
    res.status(201).json({ message: 'Order created successfully', order: newOrder });
  } catch (error) {
    res.status(400).json({ message: 'Failed to create order', error: error.message });
  }
});

app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

 
const verifyToken = (req, res, next) => {
  let jwtoken
  const  authgeader = req.headers["authorization"];
    if(authgeader!== undefined){
      jwtoken =  authgeader.split(" ")[1]
    }

  if (!jwtoken) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(jwtoken, 'secret_key', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.userId = decoded.userId;
    next();
  });
};

app.get('/data', verifyToken, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.get('/sumdata', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
