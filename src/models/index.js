import Sequelize from 'sequelize'
import config from '../config'

export default new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  config.db
)
