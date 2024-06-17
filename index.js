import express from 'express'
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import login from './routes/Login.js'
import register from './routes/Register.js'
import venue from './routes/Venue.js'
import { token_verification } from './common_functions.js';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import multer from 'multer';
import path from 'path'
import { get_Applications, get_Performer, insert_Application, get_Applications_length, update_Venue_Status, get_Events, get_Events_length, insert_ticket } from './model/database.js';
import { PutObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';


dotenv.config()


const port = process.env.PORT;

const app = express()
app.use(cors( {origin: 'https://eventify-digitalocean-frontend.onrender.com',
  credentials: true,
  secure: true}));

app.use(cookieParser());
app.use(express.json())

/*
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');

  next();
});
*/
/*
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5000');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');

  next();
});

*/

function s3_client(){
  return new S3Client({
    endpoint: "https://fra1.digitaloceanspaces.com", 
    forcePathStyle: false, 
    region: "fra1", 
    sslEnabled: false,
    credentials: {
      accessKeyId: "DO00XD28FDQZK44AL8MB", 
      secretAccessKey: process.env.SPACES_SECRET 
  }});
}



//app.use(cors())
app.use('/register', register);

app.use('/login', login);

app.use('/venue', venue);




async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('base64');
}

function isImageDataEmpty(data) {
    return !data || data.trim() === '';
}


app.get("/", async (req, res) => {
  try {

    const s3Client = s3_client();

  const images = [];
  for (let i=0; i < 1; i++){

 
    
    console.log(`first-page/f-${i}.png`)

    const params = {
    Key: `first-page/f-${i}.png` ,
    Bucket: `eventify-user-images`
    };
    const data = await s3Client.send(new GetObjectCommand(params));
    

    const imageData = await streamToString(data.Body);
    // Store the image data
    images.push(imageData);
    if (isImageDataEmpty(imageData)) {
  console.log('imageData is empty or undefined');
    }}

  
    res.send(images)

  }
    
    catch(e){
      console.log(e)
    }
 
  
});


app.use(token_verification)

app.post('/apply', async (req, res) =>{



const id = await get_Performer(req.user.email)

await insert_Application(id[0].ID, req.body.selectedTime)
res.send('heheh')
  
})


app.post('/application', async (req, res) =>{

try {
  const { pageNumber, pageSize} = req.body; // Assuming pageNumber is passed as a query parameter

  const result = await get_Applications(pageNumber, pageSize, req.user.id);

  if (isNaN(pageNumber)) {
    res.status(400).json({ error: 'Invalid pageNumber parameter' });
    return;
  }

  const len = await get_Applications_length();

  const s3Client = s3_client(); 


  let pSize = 2
    if ((pageNumber*pSize) > len){
      pSize = 1
    }

  const venue_images = [];
  const performer_images = [];
  for (let i=0; i < pSize; i++){

    const containerName =  req.user.id;
    
    console.log(`img-user-${containerName}/${result[i].VenueID}-0.png`)

    const params = {
    Key: `img-user-${containerName}/${result[i].VenueID}-0.png` ,
    Bucket: `eventify-user-images`
    };
    const data = await s3Client.send(new GetObjectCommand(params));
    

    const imageData = await streamToString(data.Body);
    // Store the image data
    venue_images.push(imageData);
    if (isImageDataEmpty(imageData)) {
  console.log('imageData is empty or undefined');


  
} else {
    console.log('okay')
}
 
    const params_per = {
    Key: `img-performer-${result[i].PerformerID}/0.png` ,
    Bucket: `eventify-user-images`
    };
    const data_per = await s3Client.send(new GetObjectCommand(params_per));
    

    const imageData_per = await streamToString(data_per.Body);
    // Store the image data
    performer_images.push(imageData_per);
    if (isImageDataEmpty(imageData_per)) {
  console.log('imageData_per is empty or undefined');


  
} else {
    console.log('okay')
}
    }
    
    console.log(venue_images.length)
    console.log(performer_images.length)
    
    const responseObject = {
      result: result,
      venue_images: venue_images,
      performer_images: performer_images
    };

   
    res.send(responseObject)
    
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
  
})


let m = multer()




app.post('/verdict', async (req, res)=>{

  const ID= req.body.entry.venueavailabilityID;
  const PerformerID= req.body.entry.performerID;

  await  update_Venue_Status(ID, PerformerID);

});

app.post('/buyticket', async (req, res)=>{

  const SpectatorID = req.user.id;
 
  const venueavailabilityID = req.body.entry.venueavailabilityID;

  insert_ticket(venueavailabilityID, SpectatorID);


});


app.post('/events', async(req, res)=>{

    try {
  const { pageNumber, pageSize} = req.body; // Assuming pageNumber is passed as a query parameter

  const result = await get_Events(pageNumber, pageSize);

  if (isNaN(pageNumber)) {
    res.status(400).json({ error: 'Invalid pageNumber parameter' });
    return;
  }

  const len = await get_Events_length();

  const s3Client = s3_client();


  let pSize = 2
    if ((pageNumber*pSize) > len){
      pSize = 1
    }

  const venue_images = [];
  const performer_images = [];
  for (let i=0; i < pSize; i++){

    
    
    console.log(`img-user-${result[i].LandlordID}/${result[i].VenueID}-0.png`)

    const params = {
    Key: `img-user-${result[i].LandlordID}/${result[i].VenueID}-0.png` ,
    Bucket: `eventify-user-images`
    };
    const data = await s3Client.send(new GetObjectCommand(params));
    

    const imageData = await streamToString(data.Body);
    // Store the image data
    venue_images.push(imageData);
    if (isImageDataEmpty(imageData)) {
  console.log('imageData is empty or undefined');


  
} else {
    console.log('okay')
}
 
    console.log(`img-performer-${result[i].PerformerID}/0.png`)
    const params_per = {
    Key: `img-performer-${result[i].PerformerID}/0.png` ,
    Bucket: `eventify-user-images`
    };
    const data_per = await s3Client.send(new GetObjectCommand(params_per));
    

    const imageData_per = await streamToString(data_per.Body);
    // Store the image data
    performer_images.push(imageData_per);
    if (isImageDataEmpty(imageData_per)) {
  console.log('imageData_per is empty or undefined');


  
} else {
    console.log('okay')
}
    }
    
    console.log(venue_images.length)
    console.log(performer_images.length)
    
    const responseObject = {
      result: result,
      venue_images: venue_images,
      performer_images: performer_images
    };

   
    res.send(responseObject)
    
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

});



app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Something broke!')
})



app.listen(port, () =>{
console.log(`Server is listening on port ${port}...`)
});

