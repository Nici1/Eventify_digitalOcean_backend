import express from 'express'
import dotenv from 'dotenv'
import { token_verification, convertToMySQLDateFormat } from '../common_functions.js'
import {insert_Venue, get_Venue, get_Venue_Country, get_Venue_City, get_Venue_info, get_time_Availability, get_date_Availability, get_MyVenues, get_Venue_length, update_Venue_Description, insert_time_Availability} from '../model/database.js'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import cors from 'cors';
import multer from 'multer'
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { PutObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';


dotenv.config()
const router = express.Router()

//router.use(cookieParser());
router.use(token_verification);


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


let m = multer()

router
.route('')
.post( m.array('Image',12), async(req, res)=>{


  //console.log("Body", req.body)
  //console.log("File", req.files[0])
  const {Name, Capacity, Address, City, Description, Category} = req.body
  const s3Client = s3_client();
 
  
  

  try{

    const result = await insert_Venue(Name, Capacity, City, Address, Category, Description, req.user.id)
  

    for (let i=0; i < req.files.length; i++){

      const params = {
        Bucket: "eventify-user-images", 
        Key: `img-user-${req.user.id}/${result}-${i}.png`, 
        Body: req.files[i].buffer, 
        ACL: "private", 
        Metadata: { 
          "x-amz-meta-my-key": "your-value"
        }
      };


      const data = await s3Client.send(new PutObjectCommand(params));
      console.log("Successfully uploaded object: " + params.Bucket + "/" +params.Key);
    
    }

  

  res.send({ status: "success"})
  }
    catch(e){
      console.log(e)
    res.send({ status: "failure"})
    }
    
    
})
.put(async(req, res)=>{
    const {Name, Capacity, Address, Category} = req.body
    const result = await insert_Venue(Name, Capacity, Address, Category, req.user.id)
    res.send(result)
})


router.route('/Date').post(async (req, res)=>{
  console.log("Body ", req.body)

  

  // Example usage
  const inputDateString = req.body.date
  const mysqlDateFormat = convertToMySQLDateFormat(inputDateString);
  console.log(req.body.id, req.body.date)
  const r = await get_time_Availability(req.body.id, mysqlDateFormat)
  res.send(r)
  console.log("Result ", r); // Output: "2024-02-13"

})



router.route('/availability').post(async (req, res)=>{

  const inputDateString = req.body.date
  console.log(req.body)
  const mysqlDateFormat = convertToMySQLDateFormat(inputDateString);
  const date = new Date(mysqlDateFormat);
  const r = await get_date_Availability(req.body.id, date.getMonth()+1)

  console.log(r)

    res.send(r)
  

})


router
.route('/getImages')
.post( async (req, res) => {
  try {
    const containerName =  req.body.id;
    const s3Client = s3_client();

  const images = []

      let i = 0;

      // Continue fetching images until an error occurs
      while (true) {

      const params = {
      Key: `img-user-${req.body.id}/${req.body.venue_id}-${i}.png` ,
      Bucket: `eventify-user-images`
      };

        try {
          const data = await s3Client.send(new GetObjectCommand(params));
      
          const imageData = await streamToString(data.Body);
          // Store the image data
          images.push(imageData);
          i++;
        } catch (error) {
          // Error fetching image, exit loop
          break;
        }
      }

  //console.log(images)
  res.send(images)

      }
        
        catch(e){
          console.log(e)
          res.send(e)
        }
});

function isImageDataEmpty(data) {
    return !data || data.trim() === '';
}

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('base64');
}

router.route('/list').post(async (req, res) => {
  try {
    const { pageNumber, pageSize, City} = req.body; // Assuming pageNumber is passed as a query parameter
    const len = await get_Venue_length(City)
    if (isNaN(pageNumber)) {
      res.status(400).json({ error: 'Invalid pageNumber parameter' });
      return; 
    }
    // Assuming get_Venue supports pagination and returns data based on pageNumber
    const result = await get_Venue(pageNumber, pageSize, City);
    console.log("PageNumber ", pageNumber)

    let pSize = 2
    if ((pageNumber*pSize) > len){
      pSize = 1
    }

    console.log(pageSize)
    const s3Client = s3_client();

    const images = [];
    for (let i=0; i < pSize; i++){

      const containerName =  result[i].LandlordID;
      
      console.log( `img-user-${containerName}/${result[i].ID}-0.png`)
      const params = {
      Key: `img-user-${containerName}/${result[i].ID}-0.png` ,
      Bucket: `eventify-user-images`
      };
      const data = await s3Client.send(new GetObjectCommand(params));
      

      const imageData = await streamToString(data.Body);
      // Store the image data
      images.push(imageData);
      if (isImageDataEmpty(imageData)) {
    console.log('imageData is empty or undefined');
} else {
    console.log('okay')
}
      
    }
    
    
    const responseObject = {
      result: result,
      images: images
    };

    // Send the response object
    res.send(responseObject);

  } catch (error) {
    //console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.route('/list/country').get(async (req, res) => {
  try {
    
    const result = await get_Venue_Country();
    res.send(result);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.route('/list/city').post(async (req, res) => {
  try {
    
    const result = await get_Venue_City();
    //console.log(result[0]);
    res.send(result);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.route('/:bookName').get(async (req, res)=>{
  const { bookName } = req.params;
  console.log(req.params)
  try{
      const venueData = await get_Venue_info(bookName)
      console.log(venueData)
      res.send({venueData: venueData});
  }
  catch(error){
    res.status(500).json({ error: 'Internal Server Error' });
  }

})


router.route('/mine').post(async (req, res)=>{
  const { pageNumber, pageSize} = req.body; // Assuming pageNumber is passed as a query parameter
  const ID = req.user.id;
  


  try {
    
    if (isNaN(pageNumber)) {
      res.status(400).json({ error: 'Invalid pageNumber parameter' });
      return;
    }

    const venueData = await get_MyVenues(pageNumber, pageSize, ID)

    const s3Client = s3_client();


    console.log(venueData)

    let pSize = 2
    if ((pageNumber*pSize) > 9){
      pSize = 1
    }
  
    const images = [];
    for (let i=0; i < pSize; i++){
       try {

        console.log(`img-user-${ID}/${venueData[i].ID}-${0}.png`)

        const params = {
          Key: `img-user-${ID}/${venueData[i].ID}-${0}.png` ,
          Bucket: `eventify-user-images`
          };

        const data = await s3Client.send(new GetObjectCommand(params));
      
        const imageData = await streamToString(data.Body);
        // Store the image data
        images.push(imageData);
        
      } catch (error) {
        console.error(`Error downloading blob ${i}:`, error);
        images.push(null); // Push null to images array to indicate error
      }
    }

    console.log('the number of images found ', images.length)
    
    const responseObject = {
      result: venueData,
      images: images
    };

    // Send the response object
    res.send(responseObject);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

})

router.route('/edit').post(async (req, res)=>{
  const {description, venueID, startTime, endTime, date} = req.body

  const landlordID = req.user.id;

  console.log(req.body);
  const result = await update_Venue_Description(description, venueID, landlordID);
  
  if (startTime.length !==0 || endTime.length !==0){
    const result2 = await insert_time_Availability(venueID, startTime, endTime, convertToMySQLDateFormat(date));


  }

});



export default router;