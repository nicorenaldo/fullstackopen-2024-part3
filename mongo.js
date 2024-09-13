const mongoose = require('mongoose')

if (process.argv.length < 3) {
  console.log('give password as argument')
  process.exit(1)
}
const password = process.argv[2]
const url = `mongodb+srv://nicorenaldo14:${password}@cluster0.oxblx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
mongoose.set('strictQuery', false)

const personSchema = new mongoose.Schema({
  name: String,
  number: String,
})
const Person = mongoose.model('Person', personSchema)

main().catch((err) => console.log(err))

async function main() {
  await mongoose.connect(url)

  if (process.argv.length === 3) {
    console.log('phonebook:')
    await Person.find({}).then((result) => {
      result.forEach((person) => {
        console.log(person.name, person.number)
      })
      mongoose.connection.close()
    })
    return
  }

  if (process.argv.length === 5) {
    const person = new Person({
      name: process.argv[3],
      number: process.argv[4],
    })

    await person
      .save()
      .then(() => {
        console.log(
          `added ${person.name} number ${person.number} to phonebook`
        )
        mongoose.connection.close()
      })
      .catch((error) => {
        console.log('error connecting to MongoDB:', error.message)
      })
    return
  }

  console.log('Invalid number of arguments')
}
