
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
      throw new Error('No ID')
    }
    if (isNaN(id)) {
      throw new Error('Not A Number')
    }

    const dbResult = await prisma.utsuwa.findUnique({
      where: {
        id: Number(id)
      }
    })
    
    console.log(dbResult)

    if (dbResult == null) {
      throw new Error('Not Found')
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
    if (err.message === 'Not Found' || err.message === "Not A Number") {
      return {
        statusCode: 404,
        headers: headers,
        body: JSON.stringify({
          message: '指定IDのデータが存在しません'
        })
      }
    }
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({
        message: 'サーバー内部エラー'
      })
    }
  }
}