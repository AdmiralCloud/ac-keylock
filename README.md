# AC KeyLock
This tool can be used to lock operations (e.g. make sure workers will fetch a job only once). You can use it with Redis as distributed lock systems or with the built-in memory cache.

This package is a successor of ac-redisLock and can easily replace ac-redisLock. Please note, that callback-style is no longer available.

## Usage
### Init
Init function requires a valid redis instance.
+ redis - OPTIONAL INSTANCE ioredis instance
+ logger - OPTIONAL INSTANCE logger instance (e.g. Winston)
+ logLevel - OPTIONAL STRING logLevel for the Redis operation

```
await keylock.init()
// OR WITH REDIS
await keylock.init({ redis: REDISINSTANCE })
```

### Lock key
LockKey has the following parameters
+ key - STRING required name for the key
+ expires - OPTIONAL INT seconds after the lock is released, defaults to 10 seconds
+ value - OPTIONAL STRING value for this redisKey. Use it to compare/secure lock values

```
await keylock.lockKey(params)
// return values
{ state: 423 } -> there is already a lock on this key
{ value: 'xxxx' } -> a lock has been put on this key
```

### Release lock
ReleaseKey has the following parameters
+ key - STRING required name for the key
+ value - OPTIONAL STRING if set will be compared with the redisKey value before releasing. If not matching, the function will return an error message

```
await keylock.releaseLock(params, [callback])
// return values
{ state: 200 } -> lock has been released and deleted
```


## Examples

### Usage with Redis
```
const keyLock = require('ac-keylock')

// create a Redis instance (using io-redis)
const app.redisInstance = new Redis(options)

await keyLock.init({
  redis: app.redisInstance 
})

const params = {
  key: 'someMeaningfulKey',
}
let result = await keyLock.lockKey(params)
// { state: 423 } -> key is locked
// { value } -> value for this lock -> set as params.value for releaseLock

// redisKey is deleted and lock released
await keyLock.releaseKey(params)
// { state: 200 }
```

### Usage with built-in memory cache
```
const keyLock = require('ac-keylock')

await keyLock.init()

const params = {
  key: 'someMeaningfulKey',
}
let result = await keyLock.lockKey(params)
// { state: 423 } -> key is locked
// { value } -> value for this lock -> set as params.value for releaseLock

// redisKey is deleted and lock released
await keyLock.releaseKey(params)
// { state: 200 }

```

## Links
- [Website](https://www.admiralcloud.com/)
- [Twitter (@admiralcloud)](https://twitter.com/admiralcloud)
- [Facebook](https://www.facebook.com/MediaAssetManagement/)

## License
[MIT License](https://opensource.org/licenses/MIT) Copyright © 2009-present, AdmiralCloud AG, Mark Poepping