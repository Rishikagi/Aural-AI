const Question = require('../models/Question');

const questions = [
  // ===== JAVASCRIPT =====
  {
    topic: 'javascript', difficulty: 'Easy', frequency: 'Very Common',
    companies: ['Google', 'Meta', 'Amazon', 'Microsoft'],
    tags: ['scope', 'hoisting', 'ES6'],
    question: 'What is the difference between var, let, and const?',
    answer: 'var is function-scoped and hoisted (initialized as undefined). let and const are block-scoped and are in the "temporal dead zone" until declared. const cannot be reassigned after initialization, but objects/arrays it points to can still be mutated. Best practice: use const by default, let when reassignment is needed, avoid var.',
    followUpQuestions: ['What is hoisting?', 'Can you reassign a const object property?'],
    tips: 'Mention temporal dead zone for extra points. Common mistake: confusing const immutability with object mutability.',
    timeToAnswer: 90
  },
  {
    topic: 'javascript', difficulty: 'Medium', frequency: 'Very Common',
    companies: ['Meta', 'Netflix', 'Airbnb', 'Uber'],
    tags: ['closures', 'scope', 'functions'],
    question: 'Explain closures in JavaScript with a practical example.',
    answer: 'A closure is a function that retains access to its lexical scope even after the outer function returns. Example: a counter factory function returns an increment function that captures a private count variable. Practical uses: data privacy/encapsulation, memoization, partial application/currying, event handlers that remember state, module pattern.',
    codeExample: `function makeCounter(initial = 0) {
  let count = initial;
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count
  };
}
const counter = makeCounter(10);
counter.increment(); // 11`,
    followUpQuestions: ['How does closure relate to memory leaks?', 'Explain the module pattern using closures'],
    tips: 'Always give a concrete code example. Mention memory implications — closures keep references alive.',
    timeToAnswer: 120
  },
  {
    topic: 'javascript', difficulty: 'Hard', frequency: 'Very Common',
    companies: ['Google', 'Netflix', 'Twitter', 'Cloudflare'],
    tags: ['event-loop', 'async', 'runtime'],
    question: 'Explain the JavaScript event loop. What is the difference between microtasks and macrotasks?',
    answer: 'JS is single-threaded. The call stack executes synchronous code. When async operations complete, callbacks go to queues. Microtasks (Promise.then, queueMicrotask, MutationObserver) have higher priority and are processed fully after each task before moving to the next macrotask. Macrotasks (setTimeout, setInterval, I/O, UI rendering) are processed one per event loop iteration. Order: synchronous code → microtasks → render → macrotasks.',
    codeExample: `console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
// Output: 1, 4, 3, 2`,
    followUpQuestions: ['What is the Node.js event loop different from browsers?', 'What is process.nextTick?'],
    tips: 'Draw the loop on paper if possible. The classic "1, 4, 3, 2" example is a must-know for FAANG interviews.',
    timeToAnswer: 180
  },
  {
    topic: 'javascript', difficulty: 'Medium', frequency: 'Very Common',
    companies: ['Amazon', 'Microsoft', 'Stripe', 'Shopify'],
    tags: ['promises', 'async-await', 'error-handling'],
    question: 'How do you handle errors in async/await vs Promises?',
    answer: 'Promises use .catch() or second argument to .then(). async/await uses try/catch blocks, which is more readable and allows catching errors from multiple awaited calls in one block. Common pitfall: forgetting to await causes the promise to be unhandled. For parallel operations, use Promise.all() with try/catch. In production, always handle Promise rejections globally with process.unhandledRejection.',
    timeToAnswer: 120
  },
  {
    topic: 'javascript', difficulty: 'Hard', frequency: 'Common',
    companies: ['Google', 'Meta', 'Apple'],
    tags: ['prototype', 'inheritance', 'OOP'],
    question: 'Explain prototypal inheritance. How does it differ from classical inheritance?',
    answer: 'Every JS object has [[Prototype]] pointing to another object. Property lookup traverses the chain until null. Prototypal inheritance: objects inherit directly from other objects. Classical (class-based): classes are blueprints, instances are copies. In JS, class syntax is syntactic sugar over prototypal inheritance. Key difference: JS uses object delegation (live link to prototype), not copying.',
    timeToAnswer: 150
  },
  {
    topic: 'javascript', difficulty: 'Medium', frequency: 'Very Common',
    companies: ['Amazon', 'Flipkart', 'Walmart'],
    tags: ['this', 'binding', 'arrow-functions'],
    question: 'How does the "this" keyword work in JavaScript? How do arrow functions change it?',
    answer: 'this refers to the execution context. In methods: the object. In regular functions: global/undefined (strict mode). With call/apply/bind: explicitly set. Constructor: the new object. Arrow functions do NOT have their own this — they lexically capture this from the enclosing scope. This makes arrow functions ideal for callbacks inside methods.',
    timeToAnswer: 120
  },
  {
    topic: 'javascript', difficulty: 'Hard', frequency: 'Common',
    companies: ['Cloudflare', 'Netflix', 'Twitter'],
    tags: ['debounce', 'throttle', 'performance'],
    question: 'Implement debounce and throttle. When would you use each?',
    answer: 'Debounce delays execution until N ms after the last call — ideal for search input, resize handlers. Throttle limits execution to once per N ms — ideal for scroll handlers, mouse move. Debounce: clearTimeout on each call, setTimeout only fires after silence. Throttle: track last call time, only execute if enough time has passed.',
    codeExample: `function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function throttle(fn, limit) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}`,
    timeToAnswer: 180
  },

  // ===== REACT =====
  {
    topic: 'react', difficulty: 'Easy', frequency: 'Very Common',
    companies: ['Meta', 'Airbnb', 'Uber', 'LinkedIn'],
    tags: ['hooks', 'useState', 'useEffect'],
    question: 'What are React Hooks and why were they introduced?',
    answer: 'Hooks let functional components use state and lifecycle features without classes. Introduced in React 16.8 to solve: difficulty reusing stateful logic between components, complex class components with confusing this, and hard-to-understand lifecycle methods. Key hooks: useState (local state), useEffect (side effects), useContext, useRef, useMemo, useCallback, useReducer.',
    timeToAnswer: 90
  },
  {
    topic: 'react', difficulty: 'Hard', frequency: 'Very Common',
    companies: ['Meta', 'Google', 'Netflix', 'Spotify'],
    tags: ['reconciliation', 'virtual-dom', 'fiber'],
    question: 'How does React\'s reconciliation (diffing) algorithm work?',
    answer: 'React creates a virtual DOM tree. On re-render, it creates a new tree and diffs against the previous one using heuristics: 1) Different element types produce completely different trees (no reuse). 2) Keys allow stable matching of list items across renders. The Fiber architecture breaks work into units, allowing interruption for high-priority updates. React 18 concurrent features allow pausing/resuming rendering.',
    timeToAnswer: 180
  },
  {
    topic: 'react', difficulty: 'Medium', frequency: 'Very Common',
    companies: ['Shopify', 'Uber', 'Atlassian'],
    tags: ['performance', 'memo', 'useMemo', 'useCallback'],
    question: 'Explain React.memo, useMemo, and useCallback. When would you use each?',
    answer: 'React.memo: HOC that memoizes a component, preventing re-render if props haven\'t changed (shallow comparison). useMemo: memoizes a computed value, recalculates only when dependencies change — for expensive calculations. useCallback: memoizes a function reference — prevent child components from re-rendering when passing callbacks as props. Don\'t overuse — premature optimization adds complexity.',
    timeToAnswer: 150
  },
  {
    topic: 'react', difficulty: 'Hard', frequency: 'Common',
    companies: ['Meta', 'Google', 'Microsoft'],
    tags: ['useEffect', 'useLayoutEffect', 'lifecycle'],
    question: 'What is the difference between useEffect and useLayoutEffect?',
    answer: 'useEffect runs asynchronously after the browser has painted — good for data fetching, subscriptions, logging. useLayoutEffect runs synchronously after DOM mutations but before the browser paints — use when you need to read DOM layout (element dimensions, scroll position) and synchronously re-render to prevent visual flicker. In SSR: useLayoutEffect can cause warnings since there is no DOM.',
    timeToAnswer: 120
  },
  {
    topic: 'react', difficulty: 'Medium', frequency: 'Common',
    companies: ['Netflix', 'Amazon', 'Spotify'],
    tags: ['code-splitting', 'lazy', 'suspense', 'performance'],
    question: 'How do you implement code splitting in React?',
    answer: 'Use React.lazy() with Suspense for component-level splitting. Use dynamic import() for general splitting. Route-based splitting with React Router is the most common pattern. Webpack/Vite automatically creates separate chunks. Consider: prefetching critical routes, loading states via Suspense fallback, error boundaries for failed imports.',
    timeToAnswer: 120
  },
  {
    topic: 'react', difficulty: 'Medium', frequency: 'Very Common',
    companies: ['All companies'],
    tags: ['state-management', 'context', 'redux'],
    question: 'When would you use Context API vs Redux vs Zustand?',
    answer: 'Context API: simple global state (theme, auth, locale) that changes infrequently. Redux: complex state with many actions, time-travel debugging needs, large team with strict patterns. Zustand: simpler alternative to Redux, less boilerplate, good for medium complexity. Avoid Context for high-frequency updates — every consumer re-renders. Jotai/Recoil for atomic state.',
    timeToAnswer: 120
  },

  // ===== NODE.JS =====
  {
    topic: 'nodejs', difficulty: 'Hard', frequency: 'Very Common',
    companies: ['Netflix', 'LinkedIn', 'PayPal', 'Uber'],
    tags: ['event-loop', 'concurrency', 'non-blocking'],
    question: 'How does Node.js handle concurrency despite being single-threaded?',
    answer: 'Node.js uses libuv\'s event loop. I/O operations are offloaded to the OS kernel (epoll/kqueue) or libuv\'s thread pool (for file I/O, DNS, crypto). When operations complete, callbacks are queued. The event loop processes them on the main thread. This non-blocking model handles thousands of concurrent connections efficiently — unlike thread-per-request models that block on I/O.',
    timeToAnswer: 180
  },
  {
    topic: 'nodejs', difficulty: 'Medium', frequency: 'Very Common',
    companies: ['Stripe', 'Shopify', 'GitHub'],
    tags: ['express', 'middleware', 'http'],
    question: 'Explain middleware in Express.js. How does error handling middleware differ?',
    answer: 'Middleware are functions (req, res, next) that execute in the request-response pipeline. They can modify req/res, end the cycle, or call next() to pass control. Types: application-level, router-level, error-handling, built-in, third-party. Error-handling middleware has 4 parameters (err, req, res, next) and must be defined last. Call next(err) to skip to error handlers.',
    timeToAnswer: 120
  },
  {
    topic: 'nodejs', difficulty: 'Hard', frequency: 'Common',
    companies: ['Cloudflare', 'Netflix', 'Amazon'],
    tags: ['streams', 'buffer', 'performance'],
    question: 'What are Node.js streams and why are they important?',
    answer: 'Streams process data in chunks rather than loading entirely into memory. Types: Readable (fs.createReadStream), Writable (fs.createWriteStream), Duplex (TCP socket), Transform (zlib). Use pipe() to connect streams. Critical for: large file processing, video streaming, HTTP request/response bodies. Without streams, a 1GB file upload would consume 1GB RAM.',
    timeToAnswer: 150
  },

  // ===== SYSTEM DESIGN =====
  {
    topic: 'system-design', difficulty: 'Hard', frequency: 'Very Common',
    companies: ['Amazon', 'Google', 'Meta', 'Microsoft'],
    tags: ['scale', 'hashing', 'database'],
    question: 'Design a URL shortening service like bit.ly. Handle 100M URLs, 10B reads/day.',
    answer: 'Key decisions: Base62 encoding of auto-increment ID for collision-free short URLs. Storage: Redis for hot URLs (cache), Cassandra/DynamoDB for persistence (key-value, high read throughput). CDN for redirect speed globally. API: POST /shorten → 201 with short URL; GET /{code} → 301 redirect. Rate limiting per user. Custom aliases stored separately. Analytics via async event streaming (Kafka). Expiry via TTL.',
    timeToAnswer: 600
  },
  {
    topic: 'system-design', difficulty: 'Hard', frequency: 'Very Common',
    companies: ['Slack', 'Meta', 'Google', 'Discord'],
    tags: ['websockets', 'real-time', 'scale'],
    question: 'Design a real-time chat application for 100M users.',
    answer: 'WebSocket connections via multiple gateway servers. Redis Pub/Sub for cross-server messaging (or Kafka for durability). Message storage: Cassandra (time-series, high write throughput). Fan-out: for small groups deliver directly, for large channels use lazy loading. Presence service: Redis with TTL for online status. Push notifications (APNs/FCM) for offline users. Message ordering via Snowflake IDs.',
    timeToAnswer: 600
  },
  {
    topic: 'system-design', difficulty: 'Medium', frequency: 'Common',
    companies: ['Google', 'Amazon', 'Netflix'],
    tags: ['distributed', 'CAP', 'consistency'],
    question: 'Explain CAP theorem. How does it affect database selection?',
    answer: 'CAP: distributed system can guarantee only two of Consistency (all nodes see same data), Availability (every request gets a response), Partition Tolerance (system works despite network failures). Since partitions are inevitable, choose CP or AP. CP: PostgreSQL, MongoDB in strong consistency mode — banking, inventory. AP: DynamoDB, Cassandra — social feeds, DNS, shopping carts. Modern systems allow tunable consistency.',
    timeToAnswer: 180
  },

  // ===== BEHAVIORAL =====
  {
    topic: 'behavioral', difficulty: 'Medium', frequency: 'Very Common',
    companies: ['Amazon', 'Google', 'Meta', 'Microsoft'],
    tags: ['leadership', 'conflict', 'teamwork'],
    question: 'Tell me about a time you disagreed with a technical decision. How did you handle it?',
    answer: 'Use STAR. Show: you raised concerns respectfully with data/reasoning, you listened to the other perspective, you either persuaded or committed to the team decision gracefully. Key: demonstrate you can disagree and commit, value team cohesion while advocating for quality, and separate your ego from technical opinions. Red flags: badmouthing teammates, claiming you were always right.',
    tips: 'Amazon values "Disagree and Commit" as a leadership principle. Mention it naturally if interviewing there.',
    timeToAnswer: 180
  },
  {
    topic: 'behavioral', difficulty: 'Medium', frequency: 'Very Common',
    companies: ['Amazon', 'Google', 'Meta'],
    tags: ['failure', 'growth', 'ownership'],
    question: 'Tell me about a significant failure or mistake at work.',
    answer: 'Show ownership without excuses. Structure: what happened → your role in it → immediate impact → how you fixed it → what systems/processes you changed to prevent recurrence → what you learned. Red flags: blaming others, minimizing impact, not having a concrete lesson. Green flags: genuine reflection, system thinking (not just personal lesson), showing you raised the bar.',
    timeToAnswer: 180
  },
  {
    topic: 'behavioral', difficulty: 'Medium', frequency: 'Common',
    companies: ['All companies'],
    tags: ['prioritization', 'time-management', 'leadership'],
    question: 'How do you prioritize when you have multiple urgent tasks or competing stakeholders?',
    answer: 'Framework: Assess true urgency vs importance (Eisenhower matrix). Communicate trade-offs to stakeholders — don\'t silently drop work. Align on business impact: what\'s the cost of delay for each? Break down tasks to find quick unblocks. Use async updates to keep all parties informed. Escalate when genuinely unable to deliver without more resources.',
    timeToAnswer: 150
  },

  // ===== MONGODB =====
  {
    topic: 'mongodb', difficulty: 'Medium', frequency: 'Very Common',
    companies: ['MongoDB', 'Atlassian', 'Various startups'],
    tags: ['indexing', 'performance', 'queries'],
    question: 'Explain MongoDB indexing. When would you create a compound index vs multiple single-field indexes?',
    answer: 'Indexes improve read performance by avoiding collection scans. Single-field for queries on one field. Compound index for queries that filter/sort on multiple fields together — more efficient than separate indexes for those combined queries, follows ESR rule (Equality → Sort → Range). Covered queries (all fields in index) avoid document reads entirely. Index intersection has overhead — compound usually better for known query patterns.',
    timeToAnswer: 150
  },
  {
    topic: 'mongodb', difficulty: 'Hard', frequency: 'Common',
    companies: ['Uber', 'Lyft', 'Airbnb'],
    tags: ['aggregation', 'pipeline', 'performance'],
    question: 'Explain the MongoDB aggregation pipeline. How do you optimize it?',
    answer: 'Pipeline is a sequence of stages transforming documents: $match (filter early!), $project (reduce fields), $group (aggregate), $sort, $lookup (joins), $unwind, $limit. Optimization: put $match and $project as early as possible to reduce documents flowing through. Use indexes on $match fields. Avoid $lookup on large collections — consider denormalization. $unwind + $group can be expensive.',
    timeToAnswer: 180
  },

  // ===== DSA =====
  {
    topic: 'dsa', difficulty: 'Medium', frequency: 'Very Common',
    companies: ['Google', 'Meta', 'Amazon', 'Microsoft'],
    tags: ['arrays', 'two-pointers', 'optimization'],
    question: 'Given an array of integers, find two numbers that add up to a target sum.',
    answer: 'Brute force O(n²): nested loops. Optimized O(n) with HashMap: iterate array, for each num check if (target - num) exists in map, if yes return pair, otherwise add num to map. Space O(n). Two-pointer approach O(n log n): sort array, use left and right pointers, move based on sum vs target. Trade-off: HashMap preserves original indices, two-pointer requires sorting.',
    codeExample: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
  return [];
}`,
    timeToAnswer: 300
  },
  {
    topic: 'dsa', difficulty: 'Hard', frequency: 'Common',
    companies: ['Google', 'Meta', 'Amazon'],
    tags: ['binary-search', 'arrays', 'divide-conquer'],
    question: 'Find the median of two sorted arrays in O(log(m+n)) time.',
    answer: 'Binary search on the smaller array. Partition both arrays such that left halves combined have (m+n)/2 elements. Check if maxLeft1 <= minRight2 and maxLeft2 <= minRight1 — if yes, found correct partition. If maxLeft1 > minRight2, move partition left; otherwise move right. Edge cases: empty arrays, all elements of one array smaller.',
    timeToAnswer: 600
  }
];

const seedQuestions = async () => {
  try {
    const count = await Question.countDocuments();
    if (count > 0) {
      console.log(`📚 Database already has ${count} questions, skipping seed`);
      return;
    }
    await Question.insertMany(questions);
    console.log(`✅ Seeded ${questions.length} interview questions`);
  } catch (err) {
    console.error('Seed error:', err.message);
  }
};

module.exports = { seedQuestions };
