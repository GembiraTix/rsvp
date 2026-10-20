type Transitions<T extends string> = Record<T, T[]>

export class StateMachine<T extends string> {
  private currentState: T
  private transitions: Transitions<T>

  constructor(initialState: T, transitions: Transitions<T>) {
    this.currentState = initialState
    this.transitions = transitions
  }

  get state(): T {
    return this.currentState
  }

  advance(targetState: T) {
    const allowed = this.transitions[this.currentState]

    if (!allowed || !allowed.includes(targetState)) {
      throw new Error(
        `transition from ${this.currentState} to ${targetState} not allowed`,
      )
    }

    this.currentState = targetState
  }
}
