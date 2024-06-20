import phrases from '../phrases.json' with { type: 'json' }

export default class Phrases {
  static async getDailyPhrase () {
    const today = new Date()
    const index = today.getDate() % phrases.length
    return phrases[index]
  }
}
