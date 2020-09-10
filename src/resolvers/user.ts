import {
  Resolver,
  Query,
  Ctx,
  Arg,
  Mutation,
  ObjectType,
  Field,
} from 'type-graphql';
import { User } from 'src/entities/User';
import { DBContext } from '../types';
import argon2 from 'argon2';

@ObjectType()
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { em, req }: DBContext): Promise<User | null> {
    if (!req.session.userId) {
      return null;
    }
    const user = await em.findOne(User, { id: req.session.userId });
    return user;
  }

  @Mutation(() => Boolean)
  async register(
    @Arg('options') { username, password }: UsernamePasswordInput,
    @Ctx() { em, req }: DBContext
  ): Promise<UserResponse> {
    const userExists = em.findOne(User, { username }) !== null;
    if (userExists) {
      return {
        errors: [
          {
            field: 'username',
            message: 'user with this username already exists',
          },
        ],
      };
    }
    const hashedPassword = await argon2.hash(password);
    const user = em.create(User, {
      username: username,
      password: hashedPassword,
    });
    await em.persistAndFlush(user);

    req.session.userId = user.id;

    return { user };
  }

  @Query(() => User)
  async login(
    @Arg('options') { username, password }: UsernamePasswordInput,
    @Ctx() { em, req }: DBContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username });
    if (!user) {
      return {
        errors: [
          {
            field: 'username',
            message: 'incorrect username specified',
          },
        ],
      };
    }
    const passwordValid = await argon2.verify(user.password, password);
    if (!passwordValid) {
      return {
        errors: [
          {
            field: 'password',
            message: 'incorrect password specified',
          },
        ],
      };
    }

    req.session.userId = user.id;

    return { user };
  }
}
