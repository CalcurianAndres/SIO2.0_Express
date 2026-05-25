import {config} from 'dotenv'

config()

export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SIO'

export const PORT_URI = process.env.PORT_URI || 3000

export const EXP = process.env.EXP || '2d'

export const SEED = process.env.SEED || 'Viva-Dios-la-Libertad-y-los-pueblos-libres'