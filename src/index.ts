import 'reflect-metadata';

import { ApolloServer } from 'apollo-server-express';
import { MikroORM } from '@mikro-orm/core';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import { __prod__ } from './constants';
import { buildSchema } from 'type-graphql';
import connectRedis from 'connect-redis';
import express from 'express';
import mikroOrmConfig from './mikro-orm.config';
import redis from 'redis';
import session from 'express-session';

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();

  const app = express();

  const redisStore = connectRedis(session);
  const redisClient = redis.createClient();

  app.use(
    session({
      name: 'qid',
      store: new redisStore({ client: redisClient, disableTouch: true }),
      secret: 'dev',
      cookie: {
        maxAge: 1000 * 60 * 24 * 2, // 2 days
        httpOnly: true,
        sameSite: 'lax',
        secure: __prod__,
      },
      saveUninitialized: false,
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ em: orm.em, req, res }),
  });

  apolloServer.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log('server started on localhost:4000');
  });
};

main().catch((err) => {
  console.error(err);
});
