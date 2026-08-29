// Prisma has been replaced by Mongoose. This file is a temporary shim to
// help find remaining references. Please migrate remaining controllers to
// use Mongoose models in `src/models` and remove this shim when done.

const prisma: any = new Proxy({}, {
  get() {
    return () => {
      throw new Error('Prisma client removed. Migrate code to use Mongoose models in src/models');
    };
  }
});

export default prisma;
