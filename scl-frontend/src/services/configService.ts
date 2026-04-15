import api from './api'

export interface SchoolConfig {
  grades: string[]
  classes: string[]
  sections: string[]
}

const configService = {
  async getSchoolConfig(): Promise<SchoolConfig> {
    const response = await api.get<SchoolConfig>('/config')
    return response.data
  },
}

export default configService
