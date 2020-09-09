import { Connection, EntityManager, IDatabaseDriver } from '@mikro-orm/core';

export type DBContext = {
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
};
