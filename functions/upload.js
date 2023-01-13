const { format } = require('util')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const Multipart = require('lambda-multipart-parser')
const { Storage } = require('@google-cloud/storage');
const fs = require('fs')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Content-Type': 'application/json'
};
exports.handler = async (event, context, callback) => {
  try {
    const multipartBuffer = await Multipart.parse(event)
    const buffer = multipartBuffer.files[0].content
    
    const publicUrl = await uploadToStorage(buffer).catch(e => {
      console.error(e)
      return { statusCode: 500 }
    })

    const dbResult = await prisma.utsuwa.create({
      data: {
        url: publicUrl,
      }
    })
    console.log({dbResult})
    console.log(context)

    const response = {
      statusCode: 201,
      headers: headers,
      body: dbResult.id
    }
    
    return response
  } catch (err) {
    console.error(err)
    return { statusCode: 500 }
  }
}

async function uploadToStorage(buffer) {
  return new Promise((resolve, reject) => {
    const storage = new Storage({
      projectId: 'melta-roquro',
      credentials: {
        client_email: process.env.GCP_CLIENT_EMAIL,
        private_key: process.env.GCP_PRIVATE_KEY.split("\\n").join("\n")
      }
    })

    const bucket = storage.bucket('roquro-storage')
    const newFile = bucket.file('utsuwa_' + Date.now() + '.glb')
    const stream = newFile.createWriteStream({
      resumable: false
    })
    stream.on('finish', () => { 
      const publicUrl = format(`https://storage.googleapis.com/${bucket.name}/${newFile.name}`)
      resolve(publicUrl)
    })
    stream.on('error', (err) => {
      console.log(err)
      reject(err)
    })
    stream.end(buffer)
  })
  

}