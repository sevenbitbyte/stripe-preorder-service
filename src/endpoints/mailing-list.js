const Joi = require('@hapi/joi')
const debug = require('debug')('mailing-list')
const Stripe = require('stripe')
const moment = require('moment')
const Sendy = require('sendy-api')

let stripe = Stripe(process.env.STRIPE_KEY)
let sendy = new Sendy(process.env.SENDY_URL, process.env.SENDY_KEY)
const SendyList = process.env.SENDY_LIST

const schema = Joi.object().keys({
  email: Joi.string().email().required(),
});

const SendySubscribe = async (email)=>{
  return new Promise((resolve, reject)=>{

    sendy.subscribe({
      email: email,
      list_id: SendyList
    }, (err, result)=>{

      if(err){
        debug('subscribe error', err)
        return reject(err)
      }

      return resolve(result)

    })
  })
  
}

module.exports.mailing_list = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false; 

  console.log('has account')

  console.log(event.body)

  try{

    const valid = Joi.attempt(
      JSON.parse(event.body),
      schema
    )

    
    let subscribeStatus = false
    try{
      subscribeStatus = await SendySubscribe(valid.email)
    }
    catch(err){
      if(subscribeStatus instanceof Error){
        subscribeStatus = err.message
      } else {
        subscribeStatus = err
      }
    }

    debug(subscribeStatus)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN, // Required for CORS support to work
        'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({
        joined: subscribeStatus === true,
        error: (subscribeStatus !== true ? subscribeStatus : null)
      })
    }


  } catch (e) {
    debug('ERROR', e)
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN, // Required for CORS support to work
        'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({
        error: 'There was an error during mailing list signup.',
      }),
    }

  }
}
