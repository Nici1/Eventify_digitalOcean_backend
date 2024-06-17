import express from 'express'
import multer from 'multer'
import { PutObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {insert_Spectator, get_Spectator, insert_Landlord, get_Landlord, insert_Performer, get_Performer} from '../model/database.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
const router = express.Router()
let m = multer()


router.post('/Spectator', async(req, res)=>{
    const {Name, Surname, Email, Password} = req.body
    const hash = await bcrypt.hash(Password, 9);
    const result = await insert_Spectator(Name, Surname, Email, hash);
    const token = await jwt.sign({name:Name, surname: Surname, email: Email}, process.env.ACCESS_TOKEN_SECRET);
    res.json({status: "success", token: token})
});

router.post('/Landlord', async(req, res)=>{
    const {Name, Surname, Address, DateofBirth, Email, Password} = req.body
    console.log(req.body)
    const hash = await bcrypt.hash(Password, 9);
    const result = await insert_Landlord(Name, Surname, Address, DateofBirth, Email, hash);
    const token = await jwt.sign({name:Name, surname: Surname, email: Email}, process.env.ACCESS_TOKEN_SECRET);
    res.json({status: "success", token: token})
});

router.post('/Performer', m.array('Image', 12), async (req, res) => {

    console.log(req.files)
    const { Name, Surname, Artist, Category, Email, Password } = req.body;
    const hash = await bcrypt.hash(Password, 9);

  const s3Client = new S3Client({
    endpoint: "https://fra1.digitaloceanspaces.com",
    forcePathStyle: false,
    region: "fra1",
    sslEnabled: false,
    credentials: {
      accessKeyId: "DO00XD28FDQZK44AL8MB",
      secretAccessKey: process.env.SPACES_SECRET
    }
  });

  try {
    const result = await insert_Performer(Name, Surname, Artist, Category, Email, hash);

    for (let i = 0; i < req.files.length; i++) {
      const params = {
        Bucket: "eventify-user-images",
        Key: `img-performer-${result}/${i}.png`,
        Body: req.files[i].buffer,
        ACL: "private",
        Metadata: {
          "x-amz-meta-my-key": "your-value"
        }
      };

      const data = await s3Client.send(new PutObjectCommand(params));
      console.log("Successfully uploaded object: " + params.Bucket + "/" + params.Key);
    }

    // After uploading images, insert performer data and generate token
    
    const token = await jwt.sign({ email: Email }, process.env.ACCESS_TOKEN_SECRET);

    res.json({ status: "success", token: token });
  } catch (e) {
    console.log(e);
    res.json({ status: "failure" });
  }
});



export default router;
