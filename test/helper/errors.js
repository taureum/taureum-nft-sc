import {assert} from "chai";

const REVERT_ERROR_MESSAGE = "should contain error"
const REVERT_MESSAGE = "should not pass"

function shouldErrorContainMessage(error, message) {
    assert.equal(error.message.search(`${message}`) > 0, true, `${REVERT_ERROR_MESSAGE}: "${message}". Actual error: ${error.message}`)
}

function shouldNotPass() {
    assert.equal(true, false, REVERT_MESSAGE)
}

module.exports = {shouldNotPass, shouldErrorContainMessage}