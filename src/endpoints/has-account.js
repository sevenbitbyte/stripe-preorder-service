const Joi = require('@hapi/joi')
const debug = require('debug')('funding-status')
const Stripe = require('stripe')
const moment = require('moment')

const lookupAccount = require('../utils/lookup-account')

const schema = Joi.object().keys({
  jwt: Joi.string().required(),
});

module.exports.has_account = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false; 

  console.log('has account')

  console.log(event.body)

  const valid = Joi.attempt(
    JSON.parse(event.body),
    schema
  )

  const accountInfo = await LookupAccount(valid.jwt)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
    },
    body: JSON.stringify(accountInfo)
  }
}

/*  try {
    const valid = Joi.attempt(
      JSON.parse(event.body),
      schema
    )

    console.log(valid)

    const verification = await verifyJwt(valid.jwt)

    console.log(verification)


    callback(null,{
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Required for CORS support to work
        'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({
        ...verification
      })
    })

  } catch(e) {

    if(e.name == 'ValidationError'){
      //console.log('msg -', e.message);
      callback(null,{
        statusCode: 500,
        body: JSON.stringify(
          { error: { name: e.name }}
        ),
      });
    }
    else {
      //console.log(e.name)
      //console.log('ERROR - ', e)
      callback(null,{
        statusCode: 500,
        body: JSON.stringify({
          error: {
          name: 'BadRequest',
          message: 'BadRequest'
        }})
      });
    }
  }

      
}*/