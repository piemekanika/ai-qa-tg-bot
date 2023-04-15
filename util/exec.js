import util from 'util'
import childProcess from 'child_process'

const exec = util.promisify(childProcess.exec)

export { exec }