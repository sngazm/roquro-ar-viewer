
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Content-Type': 'application/json'
}

exports.handler = async (event, context, callback) => {
  try {

    const id = await event.queryStringParameters['id']
    if (id == null) {
      throw new Error('IDが指定されていません')
    }

    const dbResult = await prisma.utsuwa.findUnique({
      where: {
        id: Number(id)
      }
    })
    console.log(dbResult)

    if (dbResult == null) {
      return {
        statusCode: 404,
        headers: headers,
        body: JSON.stringify({
          message: '指定IDのデータが存在しません'
        })
      }
    }
    const response = {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        id: dbResult.id,
        publicUrl: dbResult.url,
        createdAt: dbResult.createdAt
      })
    }
    console.log(response)

    return response
    
  } catch (err) {
    console.error(err)
    return {
      statusCode: 500
    }
  }
}