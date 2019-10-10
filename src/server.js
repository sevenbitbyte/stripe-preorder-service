const debug = require('debug')('preorder.server')
const Hoek = require('hoek')
const morgan = require('morgan')
const express = require('express')
const cors = require('cors')
const expressListRoutes = require('express-list-routes')
const bodyParser = require('body-parser')
const {URL} = require('url');



const DefaultConfig = require('./default-config')
const ApiPrefix = 'api-v1-'

const PlaceOrderEndpoint = require('./endpoints/place-order').express


class Server {
  constructor(config){
    this.apiApp = express()
    this.router = express.Router()

    this.apiApp.use(cors())
    this.apiApp.options('*', cors({
      origin: Hoek.reach(config, 'rest.cors.originUri') || DefaultConfig.rest.cors.originUri
    }))

    if(debug.enabled){ this.apiApp.use(morgan('combined')) }

    this.apiApp.use(bodyParser.urlencoded({ extended: true }))
    this.apiApp.use(bodyParser.json())

    this.apiApp.set('trust proxy', true)

    this.apiServer = null
    this.errorHandlerTimer = null

    this.apiServerUri = new URL(Hoek.reach(config, 'rest.hostUri') || DefaultConfig.rest.restUri)
  }

  handleServerErrorRetry(error){
    debug('Error - ', JSON.stringify(error))
    this.errorHandlerTimer = setTimeout( ()=>{

      if(this.apiServer){
        this.stop().then(this.start.bind(this))
      }

    }, 1500)
  }

  async start(retry){
    debug('starting server')

    if(this.apiServer==null){
      debug('adding endpoints')

      const name =  + ''

      this.router.post('/'+ApiPrefix+'place-order', PlaceOrderEndpoint)
      this.router.get('/'+ApiPrefix+'place-order', PlaceOrderEndpoint)

    }


    if(debug.enabled){ expressListRoutes('API:', this.router ) }
    
    this.apiApp.use(this.router);

    return new Promise((resolve,reject)=>{

      const isInLambda = !!process.env.LAMBDA_TASK_ROOT;
      if (isInLambda) {
          debug('starting lambda')
          const serverlessExpress = require('aws-serverless-express');
          const server = serverlessExpress.createServer(apiApp);
          exports.main = (event, context) => serverlessExpress.proxy(server, event, context)

      } else {

        debug('starting server')
        this.apiServer = this.apiApp.listen(this.apiServerUri.port, this.apiServerUri.localhost, ()=>{
          debug('server listening')
          debug('address', this.apiServer.address())
          clearTimeout(this.errorHandlerTimer)
          this.errorHandlerTimer = null

          if(!retry){ return resolve() }
        })

        if(retry){ 
          // retry after errors
          this.apiServer.on('error', this.handleServerErrorRetry.bind(this))
          return resolve()
        }
        else {
          // stop after errors
          const errorHandler = async (error)=>{
            debug('CRITICAL - ', JSON.stringify(error))
            await this.stop()
            reject(error)
          }

          this.apiServer.on('error', errorHandler)

          this.apiServer.once('listening', ()=>{
            this.apiServer.removeAllListeners('error')
          })
        }

      }
    })
  }

  async stop(){
    return new Promise((resolve,reject)=>{
      debug('stopping api-server')

      if(!this.apiServer || !this.apiServer.listening){
        return resolve()
      }

      this.apiServer.close((err)=>{
        debug('stopped api-server')
        if(err){ return reject(err) }
        return resolve()
      })
    })
  }
}


module.exports = Server
