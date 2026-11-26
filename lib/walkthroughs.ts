import guides from './walkthroughs.json'

export type Walkthrough = {
  effort: number | null
  options: string
  steps: string[]
  processing: string
  delivery: string
  timingSource: string | null
}

export const walkthroughs: Record<string, Walkthrough | undefined> = guides
