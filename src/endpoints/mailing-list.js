const Joi = require('@hapi/joi')
const debug = require('debug')('mailing-list')
const Stripe = require('stripe')
const moment = require('moment')

let stripe = Stripe(process.env.STRIPE_KEY)
let sendy = new Sendy(process.env.SENDY_URL, process.env.SENDY_KEY)
const SendyList = process.env.SENDY_LIST

const LookupAccount = require('../utils/lookup-account')

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

  const valid = Joi.attempt(
    JSON.parse(event.body),
    schema
  )

  
  const subscribeStatus = await SendySubscribe(valid.email)

  debug(subscribeStatus)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
    },
    body: JSON.stringify(accountInfo)
  }
}
