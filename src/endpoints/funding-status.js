const Joi = require('@hapi/joi')
const debug = require('debug')('funding-status')
const Stripe = require('stripe')
const moment = require('moment')


const FundAccepting = (process.env.FUND_ACCEPTING !== undefined) ? process.env.FUND_ACCEPTING == 'true' : false;
const FundGoal = (process.env.FUND_GOAL !== undefined) ? process.env.FUND_GOAL : 50000;

let stripe = Stripe(process.env.STRIPE_KEY)

let cacheTotalAmount = undefined
let lastUpdate = new moment()


const crawlOrderStatus = async () => {

  let totalAmount = 0
  let totalOrders = 0
  let last_order = null
  let has_more = true

  while(has_more){
    const orders = await stripe.orders.list({
      created: {
        gt: 1573729756
      },
      limit: 100,
      starting_after: last_order || undefined
    })

    has_more = orders.has_more

    if(has_more){
      last_order = orders.data[ orders.data.length - 1 ].id
    }

    orders.data.map((val, idx, arr)=>{
      if(val.status == 'paid' || val.status == 'fulfilled' || val.status == 'refunded'){
        totalAmount += (val.amount) / 100
      }

      totalOrders++
    })

  }

  debug('total raised -', totalAmount, 'on', totalOrders, 'orders')

  return totalAmount
}

crawlOrderStatus().then(debug)

module.exports.funding_status = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false; 

  const deltaTime = Math.abs( moment().diff(lastUpdate, 'seconds') )

  if(cacheTotalAmount === undefined || deltaTime > 60){
    debug('update', deltaTime)
    cacheTotalAmount = await crawlOrderStatus()
    lastUpdate = new moment()
  }
  else{
    debug('from cache')
  }
  

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
    },
    body: JSON.stringify({
      funding: 0, //cacheTotalAmount,
      goal: FundGoal,
      accepting: FundAccepting,
      start: moment().startOf('isoWeek').toDate(),
      end: moment().endOf('isoWeek').toDate(),
      ts: moment()
    })
  }
}