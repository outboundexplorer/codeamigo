import 'reflect-metadata'
import { createConnection } from 'typeorm'
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";

import { __prod__ } from "./constants";
import { LessonResolver } from "./resolvers/lesson";
import { UserResolver } from "./resolvers/user";
import { Lesson } from "./entities/Lesson";
import { User } from "./entities/User";
import { Step } from './entities/Step';
import { StepResolver } from './resolvers/step';

const main = async () => {
  await createConnection({
    type: 'postgres',
    database: 'codeamigo',
    username: 'postgres',
    password: 'postgres',
    logging: true,
    synchronize: true,
    entities: [User, Lesson, Step]
  })


  const app = express();

  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  const RedisStore = connectRedis(session);
  const redis = new Redis();

  app.use(
    session({
      name: "amigoid",
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: "lax",
        secure: __prod__,
      },
      saveUninitialized: false,
      secret: "secreto",
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver, LessonResolver, StepResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ req, res, redis }),
  });

  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
};

main().catch(console.error);
