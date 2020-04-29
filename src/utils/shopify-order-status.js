const Hoek = require('@hapi/hoek')
const Shopify = require('shopify-api-node')
const {JSONPath} = require('jsonpath-plus')


const getStatus = async()=>{

  if(
    ! process.env.SHOPIFY_SHOP_NAME ||
    ! process.env.SHOPIFY_APIKEY ||
    ! process.env.SHOPIFY_PASSWORD
  )
  {
    console.log('shopify not enabled')
    return {
      raised: 0,
      units: 0
    }
  }

  const shopify = new Shopify({
    shopName: process.env.SHOPIFY_SHOP_NAME,
    apiKey: process.env.SHOPIFY_APIKEY,
    password: process.env.SHOPIFY_PASSWORD,
    apiVersion: '2019-10'
  })

  const orderCount = await shopify.order.count()

  let orderList = []
  let queryParam = {limit: 100}

  while(orderList.length < orderCount){
    const orders = await shopify.order.list(queryParam)


    queryParam.page_info = Hoek.reach(orders, 'nextPageParameters.page_info')

    orders.map( order => {
      orderList.push(order)
    })

    if(!queryParam.page_info){ break }
  }
  

  const priceQuery = `$..line_items[?(@.title === "Pocket P.C." || @.title === "Pocket P.C. w/ LoRa")].price`
  const prices = JSONPath(priceQuery, orderList)

  let sum = 0
  prices.map( price => {
    let parsed = parseFloat(price)
    sum += parsed
    return parsed
    })

  console.log ('units', prices.length)
  console.log ('raised', sum)
  
  return {
    raised: sum,
    units: prices.length
  }
}

module.exports = getStatus