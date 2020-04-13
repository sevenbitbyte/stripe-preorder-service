const Hoek = require('@hapi/hoek')
const Shopify = require('shopify-api-node')
const {JSONPath} = require('jsonpath-plus')


exports.status = async ()=>{

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

  //shopify.on('callLimits', (limits) => console.log('callLimits = ' + limits))

  const orderCount = await shopify.order.count()

  let orderList = []
  let queryParam = {limit: 100}

  while(orderList.length < orderCount){
    const orders = await shopify.order.list(queryParam)


    queryParam.page_info = Hoek.reach(orders, 'nextPageParameters.page_info')

    //console.log('nextPage', queryParam.page_info)

    orders.map( order => {
      orderList.push(order)
    })

    if(!queryParam.page_info){ break }
  }
  
  let total_tax = 0
  let total_price = 0
  let total_line_items_price = 0

  orderList.map( order => {
    total_tax += parseFloat(order.total_tax)
    total_price += parseFloat(order.total_price)
    total_line_items_price += parseFloat(order.total_line_items_price)
  })

  console.log('limits = ', shopify.callLimits)
  console.log('total_line_items_price $' + Math.round(total_line_items_price * 100) / 100)
  console.log('total_price $'+ Math.round(total_price * 100) / 100)
  console.log('total_tax $'+ Math.round(total_tax * 100) / 100)



  const priceQuery = `$..line_items[?(@.title === "Pocket P.C." || @.title === "Pocket P.C. w/ LoRa")].price`
  const prices = JSONPath(priceQuery, orderList)

  let sum = 0
  prices.map( price => {
    let parsed = parseFloat(price)
    sum += parsed
    return parsed
    })

  let avgPrice = sum / prices.length
  console.log ('avgPrice', avgPrice)
  console.log ('units', prices.length)
  console.log ('raised', sum)
  
  return {
    raised: sum,
    units: prices.length
  }
}