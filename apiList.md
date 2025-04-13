# DevTinder APIs

## authRouter
-- POST /signup
-- POST /login
-- POST /logout

## profileRouter
-- GET /profile/view
-- PATCH /profile/edit
-- PATCH /profile/password

## connectionRequestRouter
-- POST /request/send/interested/:toUserId
-- POST /request/send/ignore/:userId
-- POST /request/review/accepted/:userId
-- POST /request/review/rejected/:userId


## userRouter
-- GET /user/connections
-- GET /user/requests/received
-- GET /user/feed - Gets you the profiles of other users on platform 

Status: ignore,intersted,accepted,rejected
