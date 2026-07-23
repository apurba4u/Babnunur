import app from './src/app';

const stack = (app as any)._router.stack;
stack.forEach((layer: any, i: number) => {
  if (layer.route) {
    console.log(i, 'ROUTE:', layer.route.path, Object.keys(layer.route.methods));
  } else if (layer.name === 'router' && layer.handle?.stack) {
    console.log(i, 'SUB-ROUTER:', layer.regexp?.toString(), layer.handle.stack.length, 'routes, mount:', layer.regexp?.source);
    layer.handle.stack.forEach((r: any, j: number) => {
      if (r.route) console.log('  ', j, r.route.path, Object.keys(r.route.methods));
    });
  } else {
    console.log(i, 'MW:', layer.name || 'anonymous', layer.regexp ? layer.regexp.toString() : 'path:', layer.path || layer.regexp?.source);
  }
});
