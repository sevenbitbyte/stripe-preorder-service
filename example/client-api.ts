import axios from 'axios'
import moment from 'moment'
import Cookies from 'universal-cookie';

const SrvIsAuthed = process.env.REACT_APP_URL_IS_AUTHED + ''
const SrvUriFundingStatus = process.env.REACT_APP_URL_FUNDING_STATUS + ''
const SrvMailingList = process.env.REACT_APP_URL_MAILING_LIST + ''

const SrvCreateCustomer = process.env.REACT_APP_URL_CREATE_CUSTOMER + ''
const SrvCreateCard = process.env.REACT_APP_URL_CREATE_CARD + ''
const SrvCreateOrder = process.env.REACT_APP_URL_CREATE_ORDER + ''
const SrvPayOrder = process.env.REACT_APP_URL_PAY_ORDER + ''
const SrvListOrders = process.env.REACT_APP_URL_LIST_ORDERS + ''
const SrvAttachToken = process.env.REACT_APP_URL_ATTACH_TOKEN + ''

//const Axios = require('axios')
const Debug = require('debug')
const debug = Debug('preorder-api')
const cookies = new Cookies();

declare interface IAddress {
  line1: string;  //! Required
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

declare interface IShippingAddress {
  address: IAddress;
  name: string;
  phone?: string;
}

declare interface IBillingAddress {
  //! Really, they have three address formats
  address_line1: string;
  address_line2?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_country?: string;
}


export declare interface ICardInfo extends IBillingAddress {
  //! https://stripe.com/docs/api/tokens/create_card
  exp_month: number;
  exp_year: number;
  number: string;     //! credit card number
  cvc: string;
  name?: string;
}

export declare interface ICustomer {
  name: string;
  email?: string;
  phone?: string;
  //address?: IAddress;
  //description?: string;
  shipping: IShippingAddress
}

declare interface IOrderItem {
  quantity: number;
  sku: string;
}

declare interface IOrderRequest {
  products: IOrderItem[],
}

declare interface IStatus {
  funding: number;
  goal: number;
  accepting: Boolean;
  start?: Date;
  end?: Date;
}

declare interface IAccountInfo {
  isValid: boolean;
  userName: string;
  clientId: string;
  email: string;
  emailVerified: boolean;
  customerId?: string;
  sourceId?: string;
  address?: IAddress;
}


export const accountInfo = async ():  Promise<IAccountInfo> =>  {
  try{
    const authed = await axios.post(SrvIsAuthed, { jwt: cookies.get('idToken') })
    console.log(authed.data)

    return authed.data
  }
  catch(e){
    //
  }

  return {} as IAccountInfo
}


export const createCustomer = async(customerInfo: ICustomer) => {
  debug('createCustomer')

  const customer = await axios.post(SrvCreateCustomer, { 
    jwt: cookies.get('idToken'),
    customer: customerInfo
  })

  debug('created customer', customer.data)

  return customer.data
}


export const createCard = async(cardInfo: ICardInfo) => {
  debug('createCard')

  const card = await axios.post(SrvCreateCard, { 
    jwt: cookies.get('idToken'),
    card: cardInfo
  })

  debug('created card', card.data)

  return card.data
}


export const attachToken = async(tokenId: string) => {
  debug('attachToken')

  const token = await axios.post(SrvAttachToken, { 
    jwt: cookies.get('idToken'),
    tokenId: tokenId
  })

  debug('attached token', token.data)

  return token.data
}



export const createOrder = async(order: IOrderRequest) => {

  debug('create order')

  const orderResponse = await axios.post(SrvCreateOrder, { 
    jwt: cookies.get('idToken'),
    products: order.products
  })

  debug('created order', orderResponse.data)


  return orderResponse.data
}


export const payOrder = async(orderId: string) => {
  debug('pay order')

  const orderResponse = await axios.post(SrvPayOrder, { 
    jwt: cookies.get('idToken'),
    orderId: orderId
  })

  debug('paid order', orderResponse.data)


  return orderResponse.data
}


export const listOrders = async() => {
  debug('list orders')

  const orders = await axios.post(SrvListOrders, { 
    jwt: cookies.get('idToken')
  })

  debug('listed orders', orders.data)


  return orders.data
}

export const status = async() => {

  const fundingStatus = await axios.get(SrvUriFundingStatus)

  console.log('status',fundingStatus.data)

  return fundingStatus.data
}

export const joinMailingList = async(email: string) => {

  const joinList = await axios.post(SrvMailingList, {
    email: email
  })

  console.log('status',joinList.data)

  return joinList.data
}
