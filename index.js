require('dotenv').config()
const cors = require('cors')
const express = require('express')
var morgan = require('morgan')
const Person = require('./models/person')

const app = express()

morgan.token('body', (req) => JSON.stringify(req.body))

app.use(express.static('dist'))
app.use(express.json())
app.use(cors())
app.use(
  morgan(
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :body'
  )
)

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then((person) => {
    response.json(person)
  })
})

app.get('/info', (request, response) => {
  Person.find({}).then((persons) => {
    response.send(
      `<div>
      <p>Phonebook has info for ${persons.length} people</p>
      <p>${new Date().toLocaleString()}</p>
    </div>`
    )
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  const id = request.params.id
  Person.findById(id)
    .then((person) => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch((error) => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  const id = request.params.id
  Person.findByIdAndDelete(id)
    .then(() => {
      response.status(204).end()
    })
    .catch((error) => next(error))
})

app.put('/api/persons/:id', async (request, response, next) => {
  const id = request.params.id
  const body = request.body

  const person = {
    name: body.name,
    number: body.number,
  }

  // Check if number already exists
  const existingNumber = await Person.findOne({ number: body.number })
  if (existingNumber) {
    return response.status(400).json({
      error: 'number must be unique',
    })
  }

  Person.findByIdAndUpdate(id, person, { new: true, runValidators: true })
    .then((updatedPerson) => {
      response.json(updatedPerson)
    })
    .catch((error) => next(error))
})

app.post('/api/persons', async (request, response, next) => {
  const body = request.body

  if (!body.name || !body.number) {
    return response.status(400).json({
      error: 'name or number missing',
    })
  }

  const person = new Person({
    name: body.name,
    number: body.number,
  })

  // Check if number already exists
  const existingNumber = await Person.findOne({ number: body.number })
  if (existingNumber) {
    return response.status(400).json({
      error: 'number must be unique',
    })
  }

  const existingName = await Person.findOne({ name: body.name })
  if (existingName) {
    existingName.number = body.number
    await existingName
      .save({ runValidators: true })
      .then((savedPerson) => {
        response.json(savedPerson)
      })
      .catch((error) => next(error))
    return
  }

  person
    .save()
    .then((savedPerson) => {
      response.json(savedPerson)
    })
    .catch((error) => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

// this has to be the last loaded middleware, also all the routes should be registered before this!
app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
