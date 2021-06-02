const Rapier = require('../rapier2d-node');

// create world and event queue
let world = new Rapier.World({ x: 0, y: 0 });
let events = new Rapier.EventQueue(true);

// create two entities on a collision course
let e1 = makeEntity(-1, 0.1, 1, 0, 0.5);
let e2 = makeEntity(1, 0, -1, 0, 0.5);

// simulate 1 second
for (let i = 0; i < 60; i++) {
  world.step(events);

  events.drainContactEvents((handle1, handle2, contactStarted) => {
    console.log(
      `Contact between: ${handle1} and ${handle2}. Started: ${contactStarted}`,
    );
  });

  let t1 = e1.translation();
  let t2 = e2.translation();
  console.log(
    `(${t1.x.toFixed(3)},${t1.y.toFixed(3)}) (${t2.x.toFixed(3)},${t2.y.toFixed(
      3,
    )})`,
  );
}

console.log('Simulation done.');

// util function to make an rigid body entity with a circle collider
function makeEntity(x, y, vx, vy, r) {
  let bodyDesc = new Rapier.RigidBodyDesc(Rapier.BodyStatus.Dynamic);
  bodyDesc.setTranslation(x, y);
  let body = world.createRigidBody(bodyDesc);
  world.createCollider(Rapier.ColliderDesc.ball(r), body.handle);
  body.applyImpulse({ x: vx, y: vy }, true);
  return body;
}
