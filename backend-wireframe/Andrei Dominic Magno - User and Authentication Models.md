## User Model

| Field         | Data Type | Required? | Constraints / Description                                                 |
| ------------- | --------- | --------- | ------------------------------------------------------------------------- |
| id            | Integer   | yes       | Primary key, auto-increment                                               |
| email         | String    | yes       | unique, valid email format                                                |
| password_hash | String    | yes       | Stores the one-way hashed password and is never returned in API responses |
| created_at    | DateTime  | Yes       | defaults to current time                                                  |
| updated_at    | DateTime  | Yes       | updates when changed                                                      |

## User Relationships
- One user can create many skills

## Authentication Requirements

- Passwords are hashed before being stored and are never stored as plain text.
- After login, the API gives the user a JWT. The user sends this token with protected requests so the API can recognize the request came from an authenticated user
- Must be logged in to create a new skill
- Must be logged in and be the owner to update or delete a skill.


## Authentication and User Endpoints

| Endpoint                    | HTTP Method | Description                  | Request Parameters                           | Response                                                                                                                             |
| --------------------------- | ----------- | ---------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| /api/auth/register          | POST        | Creates a new user           | email, password                              | 201: A new user was successfully created<br>409: email already exists<br>400: invalid registration data                              |
| /api/auth/login             | POST        | Log in as existing user      | email, password                              | 200: successful login; JWT access token returned<br>400: invalid or missing login data<br>401: incorrect credentials                 |
| /api/users/me               | GET         | View own profile             | JWT authentication required                  | 200: returns user id, email, and created_at <br>401: missing or invalid token                                                        |
| /api/users/me               | PUT         | Update own profile           | JWT authentication required, email, password | 200: successful user profile update<br>400: invalid email or password data<br>401: missing or invalid token<br>409: new email in use |
| /api/users/{user_id}        | GET         | view another user            | user_id path parameter                       | 200: user profile returned<br>404: user not found                                                                                    |
| /api/users/{user_id}/skills | GET         | view a user's created skills | user_id path parameter                       | 200: list of user's skills returned; may be empty<br>404: user not found                                                             |
## Authentication and Middleware

### JWT Authentication
After a successful login, the API will create a JWT access token. The client will send the token in the Authorization Bearer <token> header. 

The following endpoints require authentication: 
- PUT /api/users/me
- GET /api/users/me
- POST /api/skills
- PUT /api/skills/{skill_id}
- DELETE /api/skills/{skill_id}

If the token is missing, invalid, or expired, the API will return a `401 Unauthorized`. Updating or deleting a skill also requires the authenticated user to be the owner of that skill.

### CORS
The backend will use the CORS middleware to allow the approved front-end application to communicate with the FastAPI back-end application. Requests from unapproved origins should be blocked by the backend.
### Logging
The backend will use logging middleware to record important information about API requests, including the HTTP method, endpoint path, response status code, and request processing time.

Sensitive information, including passwords, password hashes, and JWT tokens, must not be included in logs.

### Protected Routes
Protected routes will require a valid JWT before processing the request. The API will use the user ID from the token to identify the authenticated user.

For skill updates and deletions, the API will compare the authenticated user’s ID with the skill’s `user_id`. If the user does not own the skill, the API will return `403 Forbidden`.