require('dotenv').config()
const mongoose=require('mongoose')
const connectToMongo=async ()=>{
    await mongoose.connect(process.env.DB_URI)
        .then(()=>{
        console.log('Connected to MongoDb successfully')
    })
    .catch((err)=>{
        console.log('Error', err)
    })
}
module.exports = connectToMongo;