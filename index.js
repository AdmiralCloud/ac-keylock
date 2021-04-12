const _ = require('lodash')
const { v4: uuidV4 } = require('uuid')

const NodeCache = require( "node-cache" )

const keyLock = function() {
  /**
   * @param params.redis {Instance} Redis instance to use
   * @param params.logger {Instance} optional logger (e.g. Winston). Falls back to console
   * @param params.logLevel {String} optional logLevel
   */

  const init = async function(params) {
    this.redis = params.redis
    this.logger = _.get(params, 'logger', console)
    this.logLevel = _.get(params, 'logLevel', 'log')

    // make a test connection
    if (this.redis) {
      const testKey = uuidV4()
      try {
        await this.redis.set(testKey, 1, 'EX', 1)
      }
      catch(e) {
        this.logger['error']({ message: 'cannotConnectToRedis' })
      }
    }
    else {
      // use memory cache
      this.storage = new NodeCache()
    }
  }

  /**
   * @param params.key {String} REQUIRED identifier
   * @param params.expires {Integer} optional seconds to expire the key automatically
   * @param cb (err or null) err can be 423 (redis key is locked) or a real error or null
   */
  const lockKey = async function(params) {
    const key = params.key
    if (!key) {
      throw Error('ackeylock_lockKey_key_isRequired')
    }
    const expires = (params.expires && parseInt(params.expires)) || 10 // 10 seconds default value
    const value = params.value || uuidV4()

    if (this.redis) {
      let result = await this.redis.set(key, value, 'EX', expires, 'NX')
      if (result === 'OK') return { value }
      else return { state: 423 }
    }
    else {
      if (this.storage.has(key)) return { state: 423 }
      this.storage.set(key, value, expires)
      return { value }
    }
  }

  const releaseLock = async function(params) {
    const key = params.key
    if (!key) {
      throw Error('ackeylock_releaseLock_key_isRequired')
    }
    const value = params.value

    if (this.redis) {
      if (value) {
        let result = await this.redis.get(key)
        if (result !== value) {
          this.logger['error']('ackeylock_releaseLock_valueMismatch | %j', { key, expected: result, value })
          throw Error('ackeylock_releaseLock_valueMismatch')
        }  
      }
      await this.redis.del(key)
      return { state: 200 }
    }
    else {
      if (value) {
        let result = this.storage.get(key)
        if (result !== value) {
          this.logger['error']('ackeylock_releaseLock_valueMismatch | %j', { key, expected: result, value })
          throw Error('ackeylock_releaseLock_valueMismatch')  
        }
      }
      this.storage.del(key)
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
