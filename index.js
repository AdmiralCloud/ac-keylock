const _ = require('lodash')
const { v4: uuidV4 } = require('uuid')

const NodeCache = require( "node-cache" )

const keyLock = () => {

  let lockBaseParams = {} 
 
  /**
   * @param params.redis {Instance} Redis instance to use
   * @param params.logger {Instance} optional logger (e.g. Winston). Falls back to console
   * @param params.logLevel {String} optional logLevel
   */

  const init = async (params) => {
    lockBaseParams = {
      redis: _.get(params, 'redis'),
      logger: _.get(params, 'logger', console),
      logLevel: _.get(params, 'logLevel', 'log')
    }

    // make a test connection
    if (lockBaseParams.redis) {
      const testKey = uuidV4()
      try {
        await lockBaseParams.redis.set(testKey, 1, 'EX', 1)
      }
      catch(e) {
        lockBaseParams.logger['error']({ message: 'cannotConnectToRedis' })
      }
    }
    else {
      // use memory cache
      lockBaseParams.storage = new NodeCache()
    }
  }

  /**
   * @param params.key {String} REQUIRED identifier
   * @param params.expires {Integer} optional seconds to expire the key automatically
   * @param cb (err or null) err can be 423 (redis key is locked) or a real error or null
   */
  const lockKey = async (params) => {
    const key = params.key
    if (!key) {
      throw Error('ackeylock_lockKey_key_isRequired')
    }
    const expires = (params.expires && parseInt(params.expires)) || 10 // 10 seconds default value
    const value = params.value || uuidV4()

    if (lockBaseParams.redis) {
      let result = await lockBaseParams.redis.set(key, value, 'EX', expires, 'NX')
      if (result === 'OK') return { value }
      else return { state: 423 }
    }
    else {
      if (lockBaseParams.storage.has(key)) return { state: 423 }
      lockBaseParams.storage.set(key, value, expires)
      return { value }
    }
  }

  const releaseLock = async (params) => {
    const key = params.key
    if (!key) {
      throw Error('ackeylock_releaseLock_key_isRequired')
    }
    const value = params.value

    if (lockBaseParams.redis) {
      if (value) {
        let result = await lockBaseParams.redis.get(key)
        if (result !== value) {
          lockBaseParams.logger['error']('ackeylock_releaseLock_valueMismatch | %j', { key, expected: result, value })
          throw Error('ackeylock_releaseLock_valueMismatch')
        }  
      }
      await lockBaseParams.redis.del(key)
      return { state: 200 }
    }
    else {
      if (value) {
        let result = lockBaseParams.storage.get(key)
        if (result !== value) {
          lockBaseParams.logger['error']('ackeylock_releaseLock_valueMismatch | %j', { key, expected: result, value })
          throw Error('ackeylock_releaseLock_valueMismatch')  
        }
      }
      lockBaseParams.storage.del(key)
      return { state: 200 }
    }
  }

  return {
    init,
    lockKey,
    releaseLock
  }
}

module.exports = keyLock()
