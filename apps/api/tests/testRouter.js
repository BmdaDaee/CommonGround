const { getUser, getRelationship } = require("./services/db");

const user = await getUser("user_123");
const rel = await getRelationship("rel_demo_001");