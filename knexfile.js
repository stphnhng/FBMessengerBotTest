// Update with your config settings.

module.exports = {

  development: {
    client: 'postgresql',
    connection: {
      database: 'herokuDB'
    },
    debug: true
  },

  staging: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user:     'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      database: 'postgres://wwulseomkoqteu:4d56f791bfb3ceb4f9a7a91d63ce272a17bdb2a67ddeb664ed9b6be562721182@ec2-54-225-76-201.compute-1.amazonaws.com:5432/dbr4b8fu5flobm',
      user:     'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
