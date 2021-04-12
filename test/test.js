const keyLock = require('../index')
const expect = require('chai').expect
const { v4: uuidV4 } = require('uuid')

const Redis = require('ioredis')
const redis = new Redis()

const testkey = uuidV4()
const expectedLockValue = uuidV4()
let lockValue

const useRedis = function() {
  describe('Use with Redis',  function() {
    this.timeout(5000)
  
    before(async() => {
      await keyLock.init({
        redis
      })
    })
  
    after(() => {
      redis.quit()
    })
  
    describe('Run test', () => {
      it('Lock for 2 seconds', async() => {
        const params = {
          key: testkey,
          value: expectedLockValue,
          expires: 2
        }
        let r = await keyLock.lockKey(params)
        expect(r).to.have.property('value', expectedLockValue)
      })
  
      it('Lock again - should fail - key is locked', async() => {
        const params = {
          key: testkey,
          expires: 2
        }
        let r = await keyLock.lockKey(params)
        expect(r).to.have.property('state', 423)
      })
  
      it('Wait for 2 seconds', done => {
        setTimeout(done, 2000)
      })
  
      it('Lock for 5 seconds - should work again', async() => {
        const params = {
          key: testkey,
          value: expectedLockValue,
          expires: 2
        }
        let r = await keyLock.lockKey(params)
        expect(r).to.have.property('value', expectedLockValue)
        lockValue = r.value
      })
  
      it('Release lock', async() => {
        const params = {
          key: testkey,
          lockValue
        }
        let r = await keyLock.releaseLock(params)
        expect(r).to.have.property('state', 200)
      })
    })
  })
}

const useMemory = function() {
  describe('Use with Memory',  function() {
    this.timeout(5000)
  
    before(async() => {
      await keyLock.init({})
    })
  
  
    describe('Run test', () => {
      it('Lock for 2 seconds', async() => {
        const params = {
          key: testkey,
          value: expectedLockValue,
          expires: 2
        }
        let r = await keyLock.lockKey(params)
        expect(r).to.have.property('value', expectedLockValue)
      })
  
      it('Lock again - should fail - key is locked', async() => {
        const params = {
          key: testkey,
          expires: 2
        }
        let r = await keyLock.lockKey(params)
        expect(r).to.have.property('state', 423)
      })
  
      it('Wait for 2 seconds', done => {
        setTimeout(done, 2000)
      })
  
      it('Lock for 5 seconds - should work again', async() => {
        const params = {
          key: testkey,
          value: expectedLockValue,
          expires: 2
        }
        let r = await keyLock.lockKey(params)
        expect(r).to.have.property('value', expectedLockValue)
        lockValue = r.value
      })
  
      it('Release lock', async() => {
        const params = {
          key: testkey,
          value: lockValue
        }
        let r = await keyLock.releaseLock(params)
        expect(r).to.have.property('state', 200)
      })
    })
  })
}

const handleErrors = function() {

  describe('Handle errors with Memory',  function() {
    this.timeout(5000)
  
    before(async() => {
      await keyLock.init({})
    })

    describe('Run test', () => {
      it('Missing key', async() => {
        const params = {
          value: expectedLockValue,
          expires: 2
        }
        try {
          await keyLock.lockKey(params)
        }
        catch (e) {
          expect(e).to.be.instanceOf(Error)
          expect(e.message).to.eql('ackeylock_lockKey_key_isRequired')
        }
      })

      it('Lock for 2 seconds', async() => {
        const params = {
          key: testkey,
          value: expectedLockValue,
          expires: 2
        }
        let r = await keyLock.lockKey(params)
        expect(r).to.have.property('value', expectedLockValue)
        lockValue = r.value
      })

      it('Release lock with wrong value - should fail', async() => {
        const params = {
          key: testkey,
          value: 'abc'
        }
        try {
          await keyLock.releaseLock(params)
        }
        catch (e) {
          expect(e).to.be.instanceOf(Error)
          expect(e.message).to.eql('ackeylock_releaseLock_valueMismatch')
        }
      })

      it('Release lock with value - should work', async() => {
        const params = {
          key: testkey,
          value: lockValue
        }
        const r = await keyLock.releaseLock(params)
        expect(r).to.have.property('state', 200)

      })

    })
  })
}


// test suites
useRedis()
useMemory()
handleErrors()