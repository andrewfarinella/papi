import axios from 'axios'

const MapiEndpoint = class {
  constructor (args) {
    const defaults = {
      method: 'GET',
      endpoint: '/',
      hasParams: false,
      params: null,
      hasBody: false,
      requiresAuth: false
    }

    const options = {...defaults, ...args}

    // There is a param included in the endpoint but the params haven't been set up, so we'll interpret the endpoint
    // and set up the params as best we can...
    if (options.endpoint.includes(':') && (!options.hasParams || (options.hasParams && options.params === null))) {
      options.params = []
      options.hasParams = true

      // This regex is used to match the param pattern ':param?'
      const regex = /:[a-zA-Z_?]+/gm
      let m
      while ((m = regex.exec(options.endpoint)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
          regex.lastIndex++
        }

        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
          // Remove the leading :
          const param = {
            slug: match.slice(1, match.length),
            pattern: match,
            required: true
          }

          if (param.slug.includes('?')) {
            param.slug = param.slug.slice(0, -1)
            param.required = false
          }

          options.params.push(param)
        })
      }
    }

    this.method = options.method
    this.endpoint = options.endpoint
    this.hasParams = options.hasParams
    this.params = options.params
    this.hasBody = options.hasBody
    this.requiresAuth = options.requiresAuth
  }

  buildRequestOptions () {
    const options = {}

    if (this.requiresAuth) {
      // Check auth...
    }

    return options
  }

  getEndpoint (data) {
    let endpoint = this.endpoint
    if (this.hasParams) {
      if (this.params.length === 1) {
        if (data && typeof data === 'string') {
          endpoint = endpoint.replace(this.params[0].pattern, data)
        } else if (!this.params[0].required) {
          endpoint = endpoint.replace(this.params[0].pattern, '')
        } else {
          throw new Error('Parameter required')
        }
      } else {
        for (const param of this.params) {
          if (data && data[param.slug]) {
            endpoint = endpoint.replace(param.pattern, data[param.slug])
          } else if (!param.required) {
            endpoint = endpoint.replace(param.pattern, '')
          } else {
            throw new Error('Parameter required')
          }
        }
      }
    }

    return endpoint
  }

  call (data) {
    const options = this.buildRequestOptions()

    switch (this.method) {
      case 'GET':
        return this.get(data, options)

      case 'POST':
        return this.post(data, options)

      default:
        throw new Error('Method not supported')
    }
  }

  get (data, options) {
    if (typeof data === 'number') {
      data = data.toString()
    }
    const endpoint = this.getEndpoint(data)

    return axios.get(endpoint, options)
  }

  post (data, options) {
    if (this.hasBody && !data) {
      throw new Error('API call requires body')
    }

    if (this.hasBody && !data.body) {
      data = {
        body: data
      }
    }

    const body = (this.hasBody) ? data.body : null

    const endpoint = this.getEndpoint(data)

    return axios.post(endpoint, body, options)
  }
}

export default MapiEndpoint