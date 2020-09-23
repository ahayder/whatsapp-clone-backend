import express from 'express'
import mongoose from 'mongoose'
import Messages from './dbMessages.js'
import Pusher from 'pusher'
import cors from 'cors'


// app config
const app = express()
const port = process.env.PORT || 9000

const pusher = new Pusher({
    appId: '1069524',
    key: 'f0d414d8c9c92eb1ee77',
    secret: '3d3cbae56091673c55da',
    cluster: 'ap2',
    encrypted: true
  });

// middlewares
app.use(express.json())
app.use(cors())

// dB config
const connection_url = 'mongodb+srv://ahayder:CeAq9h6T5cjIoZx7@ahaydercluster.oixmz.mongodb.net/whatsappdb?retryWrites=true&w=majority';
mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})


const db = mongoose.connection

db.once('open', ()=>{
    console.log("db is connected")

    const msgCollection = db.collection("messagecontents")
    const changeStream = msgCollection.watch()

    changeStream.on('change', (change)=> {
        console.log(change)

        if (change.operationType === 'insert'){
            const messageDetails = change.fullDocument
            pusher.trigger('message', 'inserted',
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    recieved: messageDetails.recieved
                }
            )
        } else{
            console.log("Error triggering pusher")
        }
    })
})

// ????


// api routes
app.get('/', (req, res) => res.status(200).send('hello world'))


app.get('/messages/sync', (req, res) => {
    Messages.find((err, data)=> {
        if(err) {
            res.status(500).send(err)
        } else{
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body
    
    Messages.create(dbMessage, (err, data) => {
        if(err){
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
})


// listen
app.listen(port, ()=> console.log(`Listening on localhost: ${port}`))