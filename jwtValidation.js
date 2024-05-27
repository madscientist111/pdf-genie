const jwt = require("jsonwebtoken");
const envVariable = require("./config");

const validateJWT = async (event) => {
  const token = event.headers["Authorization"];

  if (!token || !token.trim()) {
    return null;
  }

  try {
    const decoded = await jwt.verify(
      token.slice(7, token.length),
      envVariable.secret
    );
    return decoded;
  } catch (err) {
    console.log("Oops! JWT Auth Error :( ---> ", err);
    return null;
  }
};

module.exports = { validateJWT };
