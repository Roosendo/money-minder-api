import { Injectable } from '@nestjs/common'
import * as phrases from '../phrases.json'

@Injectable()
export class PhrasesService {
  async getPhrases () {
    return phrases
  }
}
