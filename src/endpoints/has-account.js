const Joi = require('@hapi/joi')
const debug = require('debug')('funding-status')
const Stripe = require('stripe')
const moment = require('moment')

const verifyJwt = require('../utils/verify-jwt')
const DefaultConfig = require('../default-config')

let stripe = Stripe(process.env.STRIPE_KEY)

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

  console.log(valid)

  const verification = await verifyJwt(valid.jwt)

  console.log(verification)

  const findByEmail = await stripe.customers.list({ email: verification.email })
  let customerStripeId = null

  if(findByEmail.data && findByEmail.data.length > 0){
    customerStripeId = findByEmail.data[0].id
    console.log('found stripe user', customerStripeId)
  } else {
    console.log('no stripe user')
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
    },
    body: JSON.stringify({
      isValid: verification.isValid,
      userName: verification.userName,
      clientId: verification.clientId,
      email: verification.email,
      emailVerified: verification.emailVerified,
      customerId: customerStripeId
    })
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