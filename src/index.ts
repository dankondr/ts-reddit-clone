import { MikroORM } from '@mikro-orm/core';

const main = async () => {
  const orm = await MikroORM.init({
    dbName: 'reddit',
    type: 'postgresql',
    debug: !__prod__,
  });
};

main();
