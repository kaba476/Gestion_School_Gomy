const bcrypt = require("bcryptjs");

bcrypt.hash("test", 10).then(hash => {
  console.log(hash);
});
