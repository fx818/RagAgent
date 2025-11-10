import mongoose from 'mongoose';

async function connectDB(url) {
    await mongoose.connect(url);
    console.log("Connected to MongoDB");
}

// module.exports = {connectDB};
export default connectDB;