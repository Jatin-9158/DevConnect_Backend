const mongoose = require("mongoose")

const connectDB = async() => {
    await mongoose.connect(
        "mongodb+srv://jatinbhatia319:myPassword@namastenode.9ooaz.mongodb.net/devTinder"
    )
}

module.exports = {connectDB};