const Joi = require('@hapi/joi')
const debug = require('debug')('funding-status')
const Stripe = require('stripe')
const moment = require('moment')

const DefaultConfig = require('../default-config')

let stripe = Stripe(process.env.STRIPE_KEY)

module.exports.funding_status = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false; 

      callback(null,{
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Required for CORS support to work
        'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({
        funding: 15000,
        goal: 50000,
        accepting: true,
        start: moment().startOf('isoWeek').toDate(),
        end: moment().endOf('isoWeek').toDate()
      })
    });
}