import jwt from "jsonwebtoken"

const generateToken = (res, userId) => {
console.log("user",userId)
  const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "30d"
  })

  res.cookie("jwt_primary", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000
  })
  return token
}

export default generateToken
