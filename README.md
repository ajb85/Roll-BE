## DadJokesBE-BW

# API BASE URL: https://dadjokes-buildweeks.herokuapp.com

## Backend API, and authorization

### Jokes have this basic format:

    {
       "id": 3,
       "joke": "joke description"
    }

- id is of type 'int', auto-generated by 'jokes' table.
- user_id is of type 'int', generated by our CRUD functions
- joke is of type 'string'

# [/api/auth/register](https://dadjokes-buildweeks.herokuapp.com/api/auth/register)

## **POST** _(registers a new user)_

**Body(Required):** _username, password_

**Headers(Required):**
**Content-Type:** _application/json_

Body:
  
 {
"username": string (Required),
"password": string (Required)
}

Responds:

    {
        "id": int,
        "username": string,
        "password": hashed string
    }

# [/api/auth/login](https://dadjokes-buildweeks.herokuapp.com/api/auth/login)

## **POST** _(logs user in, returns a USER_TOKEN)_

**Body(Required):** _username, password_

**Headers(Required):**
**Content-Type:** _application/json_
Body:
  
 {
"username": string (Required),
"password": string (Required)
}

Responds:

    {
        "message": string,
        "token": string
    }

# [/api/publicJokes](https://dadjokes-buildweeks.herokuapp.com/api/publicJokes)

## **GET** _(returns a list of public jokes)_

Responds:

    [
     {
     	"id": int,
     	"joke": "Did you hear about the guy whose whole left side was cut off? He's all right now.",
     	"votes": int or null
     }
    ]

## **POST** _(Adds a new public joke)_

**Body: 'joke' (Required)**,
**'votes' (Optional)**
**Headers:**
**Content-Type:** _application/json_, **Authorization:** _USER_TOKEN_

Body:

    {
    	"joke": string (Required)
    }

Response:

    {
        "id": int,
        "joke": string,
        "votes": null
    }

# [/api/privateJokes](https://dadjokes-buildweeks.herokuapp.com/api/privateJokes)

## **GET** _(returns a list of private jokes)_

Headers: **Authorization: USER_TOKEN**
Response:

    	{
    	    "id": int,
    	    "joke": string,
    	    "votes": null
    	}

## **POST** _(Adds a new private joke)_

_joke_id **REQUIRED** in url_

**Body: 'joke' (Required)**,
**'votes' (Optional)**
**Headers:**
**Content-Type:** _application/json_, **Authorization:** _USER_TOKEN_
Body:

        {
        	"joke": string (Required)
        }

Response:

    	{
    	    "id": int,
    	    "joke": string,
    	    "votes": null
    	}

# [/api/privateJokes/:joke_id](https://dadjokes-buildweeks.herokuapp.com/api/privateJokes/:joke_id)

## **PUT** _(updates private joke by joke_id)_

**Body(Required): 'joke'**
**Headers(Required):**
**Content-Type:** _application/json_, **Authorization:** _USER_TOKEN_

Body:

        {
        	"joke": string (Required)
        }

Response:

    	{
    	    "id": int,
    	    "joke": string,
    	    "votes": null
    	}

# [/api/privateJokes/:joke_id](https://dadjokes-buildweeks.herokuapp.com/api/privateJokes/:joke_id)

## **DELETE** _(deletes a private joke by joke_ID)_

**Headers(Required):**
**Authorization:** _USER_TOKEN_

Response:
    
    1
    
    **200 OK**
    
    or
    
    **404 NOT FOUND**
    
        {
            "errorMessage": "A joke the specified ID does not exist."
        }