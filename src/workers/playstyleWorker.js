import { recommendPersonalBuilds } from '../engine/playstyleEngine.js'

self.onmessage = (event) => {
  const { requestId, answers } = event.data ?? {}

  try {
    const analysis = recommendPersonalBuilds(answers ?? {})
    self.postMessage({ requestId, analysis })
  } catch (error) {
    self.postMessage({
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
