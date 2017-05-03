import db from './index'

export default db.define('Playgound', {
  id: {
    type: db.Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  forkId: {
    type: db.Sequelize.STRING,
    field: 'fork_id',
    allowNull: true
  },
  uuid: {
    type: db.Sequelize.STRING(50),
    allowNull: false,
    comment: 'uuid'
  },
  creator: {
    type: db.Sequelize.STRING,
    allowNull: true,
    comment: '作者'
  },
  sourceCode: {
    type: db.Sequelize.TEXT,
    allowNull: false,
    comment: '源代码',
    field: 'source_code'
  },
  sourceCSS: {
    type: db.Sequelize.TEXT,
    defaultValue: '',
    comment: '源CSS代码',
    field: 'source_css'
  },
  compilerCode: {
    type: db.Sequelize.TEXT,
    allowNull: false,
    comment: '编译后的代码',
    field: 'compiler_code'
  },
  depLibs: {
    type: db.Sequelize.STRING,
    field: 'dep_libs',
    comment: '依赖组件信息',
    get() {
      const val = this.getDataValue('depLibs');
      return val ? JSON.parse(val) : [];
    },
    set(val) {
      try {
        return this.setDataValue('depLibs', JSON.stringify(val));
      } catch (err) {
        throw new Error('Validation error: depLibs should be an object');
      }
    }
  }
}, {
  tableName: 'playground',
  timestamps: true,
  underscored: true
})
