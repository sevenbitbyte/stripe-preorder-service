const Joi = require('@hapi/joi')
const Hoek = require('@hapi/hoek')
const debug = require('debug')('funding-status')
const Stripe = require('stripe')
const moment = require('moment')
const PromiseRetry = require('promise-retry')
const ShopifyStatus = require('../utils/shopify-order-status')

const FundAccepting = (process.env.FUND_ACCEPTING !== undefined) ? process.env.FUND_ACCEPTING == 'true' : false;
const FundGoal = (process.env.FUND_GOAL !== undefined) ? process.env.FUND_GOAL : 50000;

const FundCachedTotal = process.env.FUND_PRE_TOTAL || 0

let stripe = Stripe(process.env.STRIPE_KEY)


let cacheTotalAmount = undefined
let lastUpdate = new moment(0)


const crawlOrderStatus = async () => {

  let totalAmount = 0
  let totalOrders = 0
  let last_order = undefined
  let has_more = true

  while(has_more){

    debug('lookup orders')

    const orders = await PromiseRetry({
      retries: 10,
      minTimeout: 500,
      maxTimeout: 3000
    }, async (retry, number)=>{

      debug('try', number)

      return await stripe.orders.list({
        created: {
          gt: 1573729756
        },
        limit: 100,
        starting_after: last_order || undefined
      }).catch(err=>{
        debug('stripe error [count=',number,'] ', err)
        retry(err)
      })
    })

    has_more = orders.has_more

    if(has_more){
      last_order = orders.data[ orders.data.length - 1 ].id
    }

    orders.data.map((val, idx, arr)=>{
      if(
         Hoek.reach(val, 'status_transitions.paid') > 0
      ){
        totalAmount += (val.amount) / 100
      }

      totalOrders++
    })
  }

  debug('total raised -', totalAmount, 'on', totalOrders, 'orders')

  const status = {raised: totalAmount, orders: totalOrders}

  return status
}

/*

try{
  crawlOrderStatus().then(total=>{

    cacheTotalAmount = total
    debug('total cached', cacheTotalAmount)
    lastUpdate = new moment()

  }).catch(err=>{

    debug('failed to cache order totals', err)

  })
}catch(err){

  debug('failed to cache order totals', err)

}

*/

module.exports.funding_status = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false; 

  try{
    const deltaTime = Math.abs( moment().diff(lastUpdate, 'seconds') )

    if(cacheTotalAmount === undefined || deltaTime > 30){
      debug('update', deltaTime)
      
      const stripeTotal =  await crawlOrderStatus()

      debug('stripeTotal', stripeTotal)

      const shopifyTotal = await ShopifyStatus()

      debug('shopifyTotal', shopifyTotal)

      cacheTotalAmount = (stripeTotal.raised || 0) + (shopifyTotal.raised || 0)


      lastUpdate = new moment()
    }
    else{
      debug('from cache')
    }
    

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN, // Required for CORS support to work
        'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({
        funding: cacheTotalAmount,
        goal: FundGoal,
        accepting: FundAccepting,
        start: moment().startOf('isoWeek').toDate(),
        end: moment().endOf('isoWeek').toDate(),
        ts: moment()
      })
    }


  } catch (e) {
    debug('ERROR', e)

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN, // Required for CORS support to work
        'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({
        error: 'There was an error getting latest status.',
        funding: FundCachedTotal,
        goal: FundGoal,
        accepting: FundAccepting,
        start: moment().startOf('isoWeek').toDate(),
        end: moment().endOf('isoWeek').toDate(),
        ts: moment()
      })
    }
  }
}
